import {useMemo} from 'react';
import {useHotkeys} from 'react-hotkeys-hook';

import {Menu, Modal} from 'antd';

import {ExclamationCircleOutlined} from '@ant-design/icons';

import styled from 'styled-components';

import hotkeys from '@constants/hotkeys';

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

import {Dots} from '@atoms';

import ContextMenu from '@components/molecules/ContextMenu';

import {defineHotkey} from '@utils/defineHotkey';

import Colors from '@styles/Colors';

const StyledActionsMenuIconContainer = styled.span<{isSelected: boolean}>`
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
`;

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

const ResourceKindContextMenu = (props: ItemCustomComponentProps) => {
  const {itemInstance} = props;

  const dispatch = useAppDispatch();

  const isInPreviewMode = useAppSelector(isInPreviewModeSelector);
  const previewType = useAppSelector(state => state.main.previewType);
  const resource = useAppSelector(state => state.main.resourceMap[itemInstance.id]);
  const resourceMap = useAppSelector(state => state.main.resourceMap);
  const selectedResourceId = useAppSelector(state => state.main.selectedResourceId);
  const knownResourceKinds = useAppSelector(knownResourceKindsSelector);

  const isResourceSelected = useMemo(() => {
    return itemInstance.id === selectedResourceId;
  }, [itemInstance, selectedResourceId]);

  useHotkeys(
    defineHotkey(hotkeys.DELETE_RESOURCES.key),
    () => {
      if (selectedResourceId) {
        deleteResourceWithConfirm(resource, resourceMap, dispatch);
      }
    },
    [selectedResourceId]
  );

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
    <ContextMenu overlay={<Menu items={menuItems} />}>
      <StyledActionsMenuIconContainer isSelected={itemInstance.isSelected}>
        <Dots color={isResourceSelected ? Colors.blackPure : undefined} />
      </StyledActionsMenuIconContainer>
    </ContextMenu>
  );
};

export default ResourceKindContextMenu;
