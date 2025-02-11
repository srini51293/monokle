import {Menu, Modal} from 'antd';

import {ExclamationCircleOutlined} from '@ant-design/icons';

import {AppDispatch} from '@models/appdispatch';
import {ResourceMapType} from '@models/appstate';
import {K8sResource} from '@models/k8sresource';
import {ItemCustomComponentProps} from '@models/navigator';

import {useAppDispatch, useAppSelector} from '@redux/hooks';
import {openNewResourceWizard, openRenameResourceModal, openSaveResourcesToFileFolderModal} from '@redux/reducers/ui';
import {isInPreviewModeSelector, knownResourceKindsSelector} from '@redux/selectors';
import {getResourcesForPath} from '@redux/services/fileEntry';
import {isFileResource, isUnsavedResource} from '@redux/services/resource';
import {removeResources} from '@redux/thunks/removeResources';

import ContextMenu from '@components/molecules/ContextMenu';

function deleteResourceWithConfirm(resource: K8sResource, resourceMap: ResourceMapType, dispatch: AppDispatch) {
  let title = `Are you sure you want to delete ${resource.name}?`;

  if (isFileResource(resource)) {
    const resourcesFromPath = getResourcesForPath(resource.filePath, resourceMap);
    if (resourcesFromPath.length === 1) {
      title = `This action will delete the ${resource.filePath} file.\n${title}`;
    }
  } else if (!isUnsavedResource(resource)) {
    title = `This action will delete the resource from the Cluster.\n${title}`;
  }

  Modal.confirm({
    title,
    icon: <ExclamationCircleOutlined />,
    onOk() {
      return new Promise(resolve => {
        dispatch(removeResources([resource.id]));
        resolve({});
      });
    },
    onCancel() {},
  });
}

const ResourceKindContextMenuWrapper = (props: ItemCustomComponentProps) => {
  const {itemInstance, children} = props;

  const dispatch = useAppDispatch();

  const isInPreviewMode = useAppSelector(isInPreviewModeSelector);
  const previewType = useAppSelector(state => state.main.previewType);
  const resource = useAppSelector(state => state.main.resourceMap[itemInstance.id]);
  const resourceMap = useAppSelector(state => state.main.resourceMap);
  const knownResourceKinds = useAppSelector(knownResourceKindsSelector);

  if (!resource) {
    return null;
  }

  const onClickRename = () => {
    dispatch(openRenameResourceModal(resource.id));
  };

  const onClickClone = () => {
    dispatch(
      openNewResourceWizard({
        defaultInput: {
          name: resource.name,
          kind: resource.kind,
          apiVersion: resource.version,
          namespace: resource.namespace,
          selectedResourceId: resource.id,
        },
      })
    );
  };

  const onClickDelete = () => {
    deleteResourceWithConfirm(resource, resourceMap, dispatch);
  };

  const onClickSaveToFileFolder = () => {
    dispatch(openSaveResourcesToFileFolderModal([itemInstance.id]));
  };

  const menuItems = [
    ...(isInPreviewMode || isUnsavedResource(resource)
      ? [
          {
            key: 'save_to_file_folder',
            label: 'Save to file/folder',
            disabled: isInPreviewMode,
            onClick: onClickSaveToFileFolder,
          },
          {key: 'divider', type: 'divider'},
        ]
      : []),
    {key: 'rename', label: 'Rename', onClick: onClickRename},
    ...(knownResourceKinds.includes(resource.kind)
      ? [
          {
            key: 'clone',
            label: 'Clone',
            disabled: isInPreviewMode,
            onClick: onClickClone,
          },
        ]
      : []),
    {key: 'delete', label: 'Delete', disabled: isInPreviewMode && previewType !== 'cluster', onClick: onClickDelete},
  ];

  return (
    <ContextMenu overlay={<Menu items={menuItems} />} triggerOnRightClick>
      {children}
    </ContextMenu>
  );
};

export default ResourceKindContextMenuWrapper;
