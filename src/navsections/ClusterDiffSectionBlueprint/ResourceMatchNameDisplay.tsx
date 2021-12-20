import React, {useMemo, useState} from 'react';

import {Checkbox, Modal, Tag, Tooltip} from 'antd';

import {ArrowLeftOutlined, ArrowRightOutlined, ExclamationCircleOutlined} from '@ant-design/icons';

import styled from 'styled-components';
import {stringify} from 'yaml';

import {PREVIEW_PREFIX, TOOLTIP_DELAY} from '@constants/constants';
import {makeApplyKustomizationText, makeApplyResourceText} from '@constants/makeApplyText';
import {ClusterDiffApplyTooltip, ClusterDiffCompareTooltip, ClusterDiffSaveTooltip} from '@constants/tooltips';

import {K8sResource} from '@models/k8sresource';
import {ItemCustomComponentProps} from '@models/navigator';

import {useAppDispatch, useAppSelector} from '@redux/hooks';
import {
  selectClusterDiffMatch,
  setDiffResourceInClusterDiff,
  unselectClusterDiffMatch,
  updateResource,
} from '@redux/reducers/main';
import {isKustomizationResource} from '@redux/services/kustomize';
import {applyResource} from '@redux/thunks/applyResource';

import ModalConfirmWithNamespaceSelect from '@components/molecules/ModalConfirmWithNamespaceSelect';

import {
  diffLocalToClusterResources,
  makeResourceNameKindNamespaceIdentifier,
  removeIgnoredPathsFromResourceContent,
} from '@utils/resources';

import Colors from '@styles/Colors';

const Container = styled.div<{highlightdiff: boolean; hovered: boolean}>`
  width: 100%;
  display: flex;
  justify-content: space-between;
  margin-left: -24px;
  padding-left: 24px;
  ${props => props.highlightdiff && `background: ${Colors.diffBackground}; color: ${Colors.yellow10} !important;`}
  ${props => props.hovered && `background: ${Colors.blackPearl};`}
  ${props => props.highlightdiff && props.hovered && `background: ${Colors.diffBackgroundHover}`}
`;

const Label = styled.span<{disabled?: boolean}>`
  width: 350px;
  ${props => props.disabled && `color: ${Colors.grey800};`}
`;

const StyledDiffSpan = styled.span`
  font-weight: 600;
  cursor: pointer;
  margin: 0 8px;
`;

const IconsContainer = styled.div`
  width: 80px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
`;

function ResourceMatchNameDisplay(props: ItemCustomComponentProps) {
  const {itemInstance} = props;

  const {clusterResource, localResources, ...matchMeta} = (itemInstance.meta || {}) as {
    resourceName: string;
    resourceKind: string;
    resourceNamespace: string;
    clusterResource?: K8sResource;
    localResources?: K8sResource[];
  };

  const dispatch = useAppDispatch();
  const resourceMap = useAppSelector(state => state.main.resourceMap);
  const fileMap = useAppSelector(state => state.main.fileMap);
  const kubeconfigPath = useAppSelector(state => state.config.kubeconfigPath);
  const kubeconfigContext = useAppSelector(state => state.config.kubeConfig.currentContext);
  const resourceFilterNamespace = useAppSelector(state => state.main.resourceFilter.namespace);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const matchId = useMemo(() => {
    return makeResourceNameKindNamespaceIdentifier({
      name: matchMeta.resourceName,
      kind: matchMeta.resourceKind,
      namespace: matchMeta.resourceNamespace,
    });
  }, [matchMeta]);

  const isMatchSelected = useAppSelector(state => state.main.clusterDiff.selectedMatches.includes(matchId));

  const [isApplyModalVisible, setIsApplyModalVisible] = useState(false);

  const firstLocalResource = useMemo(() => {
    return localResources && localResources.length > 0 ? localResources[0] : undefined;
  }, [localResources]);

  const areResourcesDifferent = useMemo(() => {
    if (!firstLocalResource || !clusterResource) {
      return false;
    }
    return diffLocalToClusterResources(firstLocalResource, clusterResource).areDifferent;
  }, [firstLocalResource, clusterResource]);

  const confirmModalTitle = useMemo(() => {
    if (!firstLocalResource) {
      return '';
    }

    return isKustomizationResource(firstLocalResource)
      ? makeApplyKustomizationText(firstLocalResource.name, kubeconfigContext || '')
      : makeApplyResourceText(firstLocalResource.name, kubeconfigContext || '');
  }, [firstLocalResource, kubeconfigContext]);

  const onClickDiff = () => {
    if (!firstLocalResource) {
      return;
    }
    dispatch(setDiffResourceInClusterDiff(firstLocalResource.id));
  };

  const onClickApply = () => {
    setIsApplyModalVisible(true);
  };

  const onClickApplyResource = (namespace: string) => {
    if (!firstLocalResource) {
      setIsApplyModalVisible(false);
      return;
    }

    applyResource(
      firstLocalResource.id,
      resourceMap,
      fileMap,
      dispatch,
      kubeconfigPath,
      kubeconfigContext || '',
      namespace
    );
    setIsApplyModalVisible(false);
  };

  const saveClusterResourceToLocal = () => {
    if (!firstLocalResource || !clusterResource) {
      return;
    }
    const newClusterResoureContent = removeIgnoredPathsFromResourceContent(clusterResource.content);
    const clusterResourceContentText = stringify(newClusterResoureContent, {sortMapEntries: true});

    dispatch(
      updateResource({
        resourceId: firstLocalResource.id,
        content: clusterResourceContentText,
        preventSelectionAndHighlightsUpdate: true,
      })
    );
  };

  const onClickSave = () => {
    if (!firstLocalResource || !clusterResource) {
      return;
    }
    Modal.confirm({
      title: `Replace local ${clusterResource.name} with cluster version?`,
      icon: <ExclamationCircleOutlined />,
      centered: true,
      onOk() {
        return new Promise(resolve => {
          saveClusterResourceToLocal();
          resolve({});
        });
      },
      onCancel() {},
    });
  };

  const onCheckboxChange = () => {
    if (isMatchSelected) {
      dispatch(unselectClusterDiffMatch(matchId));
    } else {
      dispatch(selectClusterDiffMatch(matchId));
    }
  };

  if (!clusterResource && !localResources) {
    return null;
  }

  return (
    <Container
      hovered={isHovered}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      highlightdiff={areResourcesDifferent}
    >
      <span style={{width: '400px'}}>
        <Checkbox checked={isMatchSelected} onChange={onCheckboxChange} style={{marginRight: '20px'}} />
        <Label disabled={!firstLocalResource}>
          {!resourceFilterNamespace && (
            <Tag color={areResourcesDifferent ? 'yellow' : 'default'}>
              {firstLocalResource?.namespace ? firstLocalResource.namespace : 'default'}
            </Tag>
          )}
          {itemInstance.name}
        </Label>
      </span>

      <IconsContainer>
        {firstLocalResource && (
          <Tooltip mouseEnterDelay={TOOLTIP_DELAY} title={ClusterDiffApplyTooltip}>
            <ArrowRightOutlined style={{color: Colors.blue6}} onClick={onClickApply} />
          </Tooltip>
        )}
        {clusterResource && firstLocalResource && (
          <Tooltip mouseEnterDelay={TOOLTIP_DELAY} title={ClusterDiffCompareTooltip}>
            <StyledDiffSpan style={{color: Colors.blue6}} onClick={onClickDiff}>
              Diff
            </StyledDiffSpan>
          </Tooltip>
        )}
        {clusterResource && !firstLocalResource?.filePath.startsWith(PREVIEW_PREFIX) && (
          <Tooltip mouseEnterDelay={TOOLTIP_DELAY} title={ClusterDiffSaveTooltip}>
            <ArrowLeftOutlined style={{color: Colors.blue6}} onClick={onClickSave} />
          </Tooltip>
        )}
      </IconsContainer>

      <Label disabled={!clusterResource}>
        {!resourceFilterNamespace && (
          <Tag color={areResourcesDifferent ? 'yellow' : !clusterResource ? 'rgba(58, 67, 68, 0.3)' : 'default'}>
            <span style={{color: !clusterResource ? '#686868' : undefined}}>
              {clusterResource?.namespace ? clusterResource.namespace : 'default'}
            </span>
          </Tag>
        )}
        {itemInstance.name}
      </Label>

      {isApplyModalVisible && (
        <ModalConfirmWithNamespaceSelect
          isVisible={isApplyModalVisible}
          resources={firstLocalResource ? [firstLocalResource] : []}
          title={confirmModalTitle}
          onOk={selectedNamespace => onClickApplyResource(selectedNamespace)}
          onCancel={() => setIsApplyModalVisible(false)}
        />
      )}
    </Container>
  );
}

export default ResourceMatchNameDisplay;
