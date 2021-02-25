// Ported from "react-window@1.8.6"
// Copyright (c) 2018 Brian Vaughn

import areEqual from './areEqual';
import shallowDiffers from './shallowDiffers';

// Custom shouldComponentUpdate for class components.
// It knows to compare individual style props and ignore the wrapper object.
// See https://reactjs.org/docs/react-component.html#shouldcomponentupdate
export default function shouldComponentUpdate(
  nextProps,
  nextState
) {
  return (
    !areEqual(this.props, nextProps) || shallowDiffers(this.state, nextState)
  );
}
