import React, {useState, useLayoutEffect, MouseEvent, TouchEvent, ReactElement, FunctionComponent} from 'react';
import styled from 'styled-components';
import {AppBorders} from '@styles/Borders';

const MIN_WIDTH = 150;
const MIN_HEIGHT = 50;
const SEPARATOR_WIDTH = 5; // width including hitbox

export type SplitViewProps = {
  contentWidth: number;
  contentHeight: number;
  left: ReactElement;
  hideLeft: boolean;
  nav: ReactElement;
  editor: ReactElement;
  right: ReactElement;
  hideRight: boolean;
  className?: string;
};

const StyledSplitView = styled.div`
  height: 100%;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
`;

export type DividerProps = {
  hide: boolean;
  vertical?: boolean;
};
const StyledDivider = styled.div`
  width: 0px;
  height: 100%;
  margin: 1px;
  border-left: ${AppBorders.pageDivider};
`;
const StyledVerticalDivider = styled.div`
  width: 100%;
  height: 0px;
  margin: 1px;
  border-bottom: ${AppBorders.pageDivider};
`;
const StyledDividerHitBox = styled.div.attrs((props: DividerProps) => props)`
  cursor: ${props => (props.vertical ? 'row-resize' : 'col-resize;')};
  align-self: stretch;
  display: ${props => (props.hide ? 'none' : 'flex')};
  align-items: center;
  padding: 0 1px;
`;

const StyledPaneDiv = styled.div`
  height: 100%;
`;

const StyledVerticalPaneContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
`;

const HorizontalPane: FunctionComponent<{
  width: number;
  hide: boolean;
}> = ({children, width, hide}) => {
  return <StyledPaneDiv style={{display: hide ? 'none' : 'inline-block', width}}>{children}</StyledPaneDiv>;
};

const VerticalPane: FunctionComponent<{
  width: number;
  height: number;
  hide: boolean;
}> = ({children, width, height, hide}) => {
  return <StyledPaneDiv style={{display: hide ? 'none' : 'inline-block', width, height}}>{children}</StyledPaneDiv>;
};

const SplitView: FunctionComponent<SplitViewProps> = ({
  contentWidth,
  contentHeight,
  left,
  hideLeft,
  nav,
  editor,
  right,
  hideRight,
}) => {
  // check if the width changes for rerendering on window resizes.
  const [viewWidth, setViewWidth] = useState<number>(contentWidth);
  if (viewWidth !== contentWidth) {
    setViewWidth(contentWidth);
  }
  const [viewHeight, setViewHeight] = useState<number>(contentHeight);
  if (viewHeight !== contentHeight) {
    setViewHeight(contentHeight);
  }

  // panes enabled
  const [leftHidden, setLeftHidden] = useState<boolean>(hideLeft);
  const [rightHidden, setRightHidden] = useState<boolean>(hideRight);
  const [navDockHidden, setNavDockHidden] = useState<boolean>(false);

  const numSeparatorsActive = 1 + (leftHidden ? 0 : 1) + (rightHidden ? 0 : 1);
  const splitPaneWidth = viewWidth - numSeparatorsActive * SEPARATOR_WIDTH;
  const splitPaneHeight = viewHeight - 2; // subtract pane dividers height

  // pane widths
  const [leftWidth, setLeftWidth] = useState<number>(0.3333);
  const [navWidth, setNavWidth] = useState<number>(0.3333);
  const [editWidth, setEditWidth] = useState<number>(0.3333);
  const [rightWidth, setRightWidth] = useState<number>(0);

  // pane heights
  const [navHeight, setNavHeight] = useState<number>(0.95);
  const [navDockHeight, setNavDockHeight] = useState<number>(0.05);

  // detect horizontal pane changes
  if (leftHidden !== hideLeft || rightHidden !== hideRight) {
    setLeftHidden(hideLeft);
    setRightHidden(hideRight);

    /*
      Possible configurations (left, right) -> left: 25%, nav: 25%, edit:25%, right:25%
      cc: closed, closed -> left: 0%, nav: 50%, edit:50%, right:0% (default)
      oc: open, closed -> left: 33%, nav: 33%, edit:33%, right:0%
      co: closed, open -> left: 0%, nav: 33%, edit:33%, right:33%
      oo: open, open -> left: 25%, nav: 25%, edit:25%, right:25%
    */
    const cfg = hideLeft && hideRight ? 'cc' : !hideLeft && hideRight ? 'oc' : hideLeft && !hideRight ? 'co' : 'oo';

    const sizeLeft = cfg === 'oc' ? splitPaneWidth * 0.33333 : cfg === 'oo' ? splitPaneWidth * 0.25 : 0;
    const sizeRight = cfg === 'co' ? splitPaneWidth * 0.33333 : cfg === 'oo' ? splitPaneWidth * 0.25 : 0;
    const sizeNavEdit =
      cfg === 'oc' || cfg === 'co'
        ? splitPaneWidth * 0.33333
        : cfg === 'oo'
        ? splitPaneWidth * 0.25
        : splitPaneWidth * 0.5;
    setLeftWidth(sizeLeft / viewWidth);
    setNavWidth(sizeNavEdit / viewWidth);
    setEditWidth(sizeNavEdit / viewWidth);
    setRightWidth(sizeRight / viewWidth);
  }

  // separator positions and drag status
  const [separatorLeftNavXPosition, setSeparatorLeftNavXPosition] = useState<number>(splitPaneWidth * 0.25);
  const [separatorNavEditXPosition, setSeparatorNavEditXPosition] = useState<number>(splitPaneWidth * 0.5);
  const [separatorEditRightXPosition, setSeparatorEditRightXPosition] = useState<number>(splitPaneWidth * 0.75);
  const [separatorNavDockYPosition, setSeparatorNavDockYPosition] = useState<number>(splitPaneHeight * 0.95);
  const [draggingLeftNav, setDraggingLeftNav] = useState(false);
  const [draggingNavEdit, setDraggingNavEdit] = useState(false);
  const [draggingEditRight, setDraggingEditRight] = useState(false);
  const [draggingNavDock, setDraggingNavDock] = useState(false);

  const onMouseDownLeftNav = (evt: MouseEvent<HTMLElement>): any => {
    setSeparatorLeftNavXPosition(evt.clientX);
    setDraggingLeftNav(true);
  };

  const onMouseDownNavEdit = (evt: MouseEvent<HTMLElement>): any => {
    setSeparatorNavEditXPosition(evt.clientX);
    setDraggingNavEdit(true);
  };

  const onMouseDownEditRight = (evt: MouseEvent<HTMLElement>): any => {
    setSeparatorEditRightXPosition(evt.clientX);
    setDraggingEditRight(true);
  };

  const onMouseDownNavDock = (evt: MouseEvent<HTMLElement>): any => {
    setSeparatorNavDockYPosition(evt.clientY);
    setDraggingNavDock(true);
  };

  const onTouchStartLeftNav = (evt: TouchEvent<HTMLElement>): any => {
    setSeparatorLeftNavXPosition(evt.touches[0].clientX);
    setDraggingLeftNav(true);
  };

  const onTouchStartNavEdit = (evt: TouchEvent<HTMLElement>): any => {
    setSeparatorNavEditXPosition(evt.touches[0].clientX);
    setDraggingNavEdit(true);
  };

  const onTouchStartEditRight = (evt: TouchEvent<HTMLElement>): any => {
    setSeparatorEditRightXPosition(evt.touches[0].clientX);
    setDraggingEditRight(true);
  };

  const onTouchStartNavDock = (evt: TouchEvent<HTMLElement>): any => {
    setSeparatorNavDockYPosition(evt.touches[0].clientY);
    setDraggingNavDock(true);
  };

  const onMouseMove = (evt: MouseEvent<HTMLElement>): any => {
    evt.preventDefault();
    onMoveX(evt.clientX);
    onMoveY(evt.clientY);
  };

  const onTouchMove = (evt: TouchEvent<HTMLElement>): any => {
    onMoveX(evt.touches[0].clientX);
    onMoveY(evt.touches[0].clientY);
  };

  const onMouseUp = () => {
    setDraggingLeftNav(false);
    setDraggingNavEdit(false);
    setDraggingEditRight(false);
    setDraggingNavDock(false);
  };

  const onMoveX = (clientX: number) => {
    if (draggingLeftNav && leftWidth && navWidth && separatorLeftNavXPosition) {
      calcPaneWidth(
        leftWidth,
        navWidth,
        clientX,
        separatorLeftNavXPosition,
        setSeparatorLeftNavXPosition,
        setLeftWidth,
        setNavWidth
      );
    }
    if (draggingNavEdit && navWidth && editWidth && separatorNavEditXPosition) {
      calcPaneWidth(
        navWidth,
        editWidth,
        clientX,
        separatorNavEditXPosition,
        setSeparatorNavEditXPosition,
        setNavWidth,
        setEditWidth
      );
    }
    if (draggingEditRight && editWidth && rightWidth && separatorEditRightXPosition) {
      calcPaneWidth(
        editWidth,
        rightWidth,
        clientX,
        separatorEditRightXPosition,
        setSeparatorEditRightXPosition,
        setEditWidth,
        setRightWidth
      );
    }
  };

  const onMoveY = (clientY: number) => {
    if (draggingNavDock && navHeight && navDockHeight && separatorNavDockYPosition) {
      calcPaneHeight(
        navHeight,
        navDockHeight,
        clientY,
        separatorNavDockYPosition,
        setSeparatorNavDockYPosition,
        setNavHeight,
        setNavDockHeight
      );
    }
  };

  const calcPaneWidth = (
    paneWidthA: number,
    paneWidthB: number,
    clientX: number,
    separatorX: number,
    setSepX: Function,
    setWidthA: Function,
    setWidthB: Function
  ): void => {
    const combinedPixelWidth = Math.floor(paneWidthA * viewWidth + paneWidthB * viewWidth);
    const newPixelWidthA = Math.floor(paneWidthA * viewWidth + clientX - separatorX);
    const newPixelWidthB = Math.floor(combinedPixelWidth - newPixelWidthA);

    setSepX(clientX);

    // if trying to resize under minimum size
    if (newPixelWidthA < MIN_WIDTH) {
      setWidthA(MIN_WIDTH / viewWidth);
      setWidthB((combinedPixelWidth - MIN_WIDTH) / viewWidth);
      return;
    }
    if (newPixelWidthB < MIN_WIDTH) {
      setWidthB(MIN_WIDTH / viewWidth);
      setWidthA((combinedPixelWidth - MIN_WIDTH) / viewWidth);
      return;
    }

    setWidthA(newPixelWidthA / viewWidth);
    setWidthB(newPixelWidthB / viewWidth);
  };

  const calcPaneHeight = (
    paneHeightA: number,
    paneHeightB: number,
    clientY: number,
    separatorY: number,
    setSepY: Function,
    setHeightA: Function,
    setHeightB: Function
  ): void => {
    const combinedPixelHeight = Math.floor(paneHeightA * viewHeight + paneHeightB * viewHeight);
    const newPixelHeightA = Math.floor(paneHeightA * viewHeight + clientY - separatorY);
    const newPixelHeightB = Math.floor(combinedPixelHeight - newPixelHeightA);

    setSepY(clientY);

    // if trying to resize under minimum size
    if (newPixelHeightA < MIN_HEIGHT) {
      setHeightA(MIN_HEIGHT / viewHeight);
      setHeightB((combinedPixelHeight - MIN_HEIGHT) / viewHeight);
      return;
    }
    if (newPixelHeightB < MIN_HEIGHT) {
      setHeightB(MIN_HEIGHT / viewHeight);
      setHeightA((combinedPixelHeight - MIN_HEIGHT) / viewHeight);
      return;
    }

    setHeightA(newPixelHeightA / viewHeight);
    setHeightB(newPixelHeightB / viewHeight);
  };

  useLayoutEffect(() => {
    // @ts-expect-error : dom event listener doesn't match React.*Event
    document.addEventListener('mousemove', onMouseMove);
    // @ts-expect-error
    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      // @ts-expect-error
      document.removeEventListener('mousemove', onMouseMove);
      // @ts-expect-error
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  });

  return (
    <StyledSplitView>
      <HorizontalPane width={leftWidth * viewWidth} hide={leftHidden}>
        {left}
      </HorizontalPane>

      <StyledDividerHitBox
        hide={leftHidden}
        onMouseDown={onMouseDownLeftNav}
        onTouchStart={onTouchStartLeftNav}
        onTouchEnd={onMouseUp}
      >
        <StyledDivider />
      </StyledDividerHitBox>

      <HorizontalPane width={navWidth * viewWidth} hide={false}>
        <StyledVerticalPaneContainer>
          <VerticalPane height={navHeight * splitPaneHeight} width={navWidth * viewWidth} hide={false}>
            {nav}
          </VerticalPane>

          <StyledDividerHitBox
            vertical
            hide={navDockHidden}
            onMouseDown={onMouseDownNavDock}
            onTouchStart={onTouchStartNavDock}
            onTouchEnd={onMouseUp}
          >
            <StyledVerticalDivider />
          </StyledDividerHitBox>

          <VerticalPane height={navDockHeight * splitPaneHeight} width={navWidth * viewWidth} hide={navDockHidden}>
            <div style={{height: '100%', width: '100%', border: '2px dashed red'}} />
          </VerticalPane>
        </StyledVerticalPaneContainer>
      </HorizontalPane>

      <StyledDividerHitBox
        hide={false}
        onMouseDown={onMouseDownNavEdit}
        onTouchStart={onTouchStartNavEdit}
        onTouchEnd={onMouseUp}
      >
        <StyledDivider />
      </StyledDividerHitBox>

      <HorizontalPane width={editWidth * viewWidth} hide={false}>
        {editor}
      </HorizontalPane>

      <StyledDividerHitBox
        hide={rightHidden}
        onMouseDown={onMouseDownEditRight}
        onTouchStart={onTouchStartEditRight}
        onTouchEnd={onMouseUp}
      >
        <StyledDivider />
      </StyledDividerHitBox>

      <HorizontalPane width={rightWidth * viewWidth} hide={hideRight}>
        {right}
      </HorizontalPane>
    </StyledSplitView>
  );
};

export default SplitView;
