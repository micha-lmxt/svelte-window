// Ported from "react-window@1.8.6"
// Copyright (c) 2018 Brian Vaughn
import ListComponent from './ListComponent.svelte';




export default function createListComponent(
  specificFunctionProps
) {
  return class List extends ListComponent {
    constructor(options){
      options.props.specificFunctionProps = specificFunctionProps;
      super(options);
    }
  }
}
