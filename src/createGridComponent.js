// Ported from "react-window@1.8.6"
// Copyright (c) 2018 Brian Vaughn
import GridComponent from './GridComponent.svelte';




export default function createGridComponent(
  specificFunctionProps
) {
  return class Grid extends GridComponent {
    constructor(options){
      options.props.specificFunctionProps= specificFunctionProps;
      super(options);
    }
  }
}