// Ported from "react-window@1.8.6"
// Copyright (c) 2018 Brian Vaughn
import shallowDiffers from './shallowDiffers';

// Custom comparison function for React.memo().
// It knows to compare individual style props and ignore the wrapper object.
// See https://reactjs.org/docs/react-api.html#reactmemo
export default function areEqual(
  prevProps,
  nextProps
) {
  const { style: prevStyle, ...prevRest } = prevProps;
  const { style: nextStyle, ...nextRest } = nextProps;

  return (
    !shallowDiffers(prevStyle, nextStyle) && !shallowDiffers(prevRest, nextRest)
  );
}
