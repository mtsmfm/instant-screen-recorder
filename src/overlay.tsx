import React, { useCallback, useEffect, useReducer } from "react";

interface Props {
  onEndSelect: (rect: Rect, innerWidth: number, innerHeight: number) => void;
}

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface State {
  startPos:
    | {
        x: number;
        y: number;
      }
    | undefined;
  endPos:
    | {
        x: number;
        y: number;
      }
    | undefined;
  rect: Rect;
  selected: boolean;
}

type Action =
  | {
      type: "startSelection";
      payload: {
        x: number;
        y: number;
      };
    }
  | {
      type: "updateSelection";
      payload: {
        x: number;
        y: number;
      };
    }
  | {
      type: "endSelection";
      payload: {
        x: number;
        y: number;
      };
    };

const initialState: State = {
  rect: { width: 0, top: 0, left: 0, height: 0 },
  startPos: undefined,
  endPos: undefined,
  selected: false,
};

const calcRect = ({ startPos, endPos }: State): Rect => {
  if (!startPos || !endPos) {
    return { left: 0, height: 0, top: 0, width: 0 };
  }

  const left = Math.min(endPos.x, startPos.x);
  const top = Math.min(endPos.y, startPos.y);
  const width = Math.abs(endPos.x - startPos.x);
  const height = Math.abs(endPos.y - startPos.y);

  return { left, top, width, height };
};

const reducer = (state: State, action: Action): State => {
  let nextState: State;

  switch (action.type) {
    case "startSelection": {
      nextState = {
        ...state,
        startPos: {
          x: action.payload.x,
          y: action.payload.y,
        },
      };
      break;
    }
    case "updateSelection": {
      nextState = {
        ...state,
        endPos: {
          x: action.payload.x,
          y: action.payload.y,
        },
      };
      break;
    }
    case "endSelection": {
      nextState = {
        ...state,
        selected: true,
        endPos: {
          x: action.payload.x,
          y: action.payload.y,
        },
      };
    }
  }

  return { ...nextState, rect: calcRect(nextState) };
};

export const Overlay: React.VFC<Props> = ({ onEndSelect }) => {
  const [
    {
      selected,
      startPos,
      rect: { top, height, left, width },
    },
    dispatch,
  ] = useReducer(reducer, initialState);

  const handleMouseDown: React.MouseEventHandler = useCallback((e) => {
    dispatch({
      type: "startSelection",
      payload: { x: e.clientX, y: e.clientY },
    });
  }, []);

  const handleMouseMove: React.MouseEventHandler = useCallback(
    (e) => {
      if (startPos) {
        dispatch({
          type: "updateSelection",
          payload: { x: e.clientX, y: e.clientY },
        });
      }
    },
    [startPos]
  );

  const handleMouseUp: React.MouseEventHandler = useCallback(
    (e) => {
      if (startPos) {
        dispatch({
          type: "endSelection",
          payload: {
            x: e.clientX,
            y: e.clientY,
          },
        });
      }
    },
    [startPos]
  );

  useEffect(() => {
    if (selected) {
      onEndSelect(
        { top, height, left, width },
        window.innerWidth,
        window.innerHeight
      );
    }
  }, [selected]);

  const style: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "black",
    opacity: 0.9,
    zIndex: 2147483647,
    cursor: "crosshair",
    WebkitMask: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><rect x="${left}" y="${top}" width="${width}" height="${height}" fill="black"/></svg>') 0/100% 100%, linear-gradient(#fff,#fff)`,
    WebkitMaskComposite: "destination-out",
  };

  if (selected) {
    style.pointerEvents = "none";
  }

  return (
    <div
      style={style}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
    ></div>
  );
};
