// Ported from "react-window@1.8.6"
// Copyright (c) 2018 Brian Vaughn

const FixedSizeGridSpecificProps = {
  getColumnOffset: ({ columnWidth },index) =>
    index * columnWidth,

  getColumnWidth: ({ columnWidth }, index) =>
    columnWidth,

  getRowOffset: ({ rowHeight }, index) =>
    index * rowHeight,

  getRowHeight: ({ rowHeight }, index) =>
    rowHeight,

  getEstimatedTotalHeight: ({ rowCount, rowHeight }) =>
    ((rowHeight)) * rowCount,

  getEstimatedTotalWidth: ({ columnCount, columnWidth }) =>
    ((columnWidth)) * columnCount,

  getOffsetForColumnAndAlignment: (
    { columnCount, columnWidth, width },
    columnIndex,
    align,
    scrollLeft,
    instanceProps,
    scrollbarSize
  ) => {
    
    const lastColumnOffset = Math.max(
      0,
      columnCount * ((columnWidth)) - width
    );
    const maxOffset = Math.min(
      lastColumnOffset,
      columnIndex * ((columnWidth))
    );
    const minOffset = Math.max(
      0,
      columnIndex * ((columnWidth)) -
        width +
        scrollbarSize +
        ((columnWidth))
    );

    if (align === 'smart') {
      if (scrollLeft >= minOffset - width && scrollLeft <= maxOffset + width) {
        align = 'auto';
      } else {
        align = 'center';
      }
    }
    
    switch (align) {
      case 'start':
        return maxOffset;
      case 'end':
        return minOffset;
      case 'center':
        // "Centered" offset is usually the average of the min and max.
        // But near the edges of the list, this doesn't hold true.
        const middleOffset = Math.round(
          minOffset + (maxOffset - minOffset) / 2
        );
        if (middleOffset < Math.ceil(width / 2)) {
          return 0; // near the beginning
        } else if (middleOffset > lastColumnOffset + Math.floor(width / 2)) {
          return lastColumnOffset; // near the end
        } else {
          return middleOffset;
        }
      case 'auto':
      default:
        if (scrollLeft >= minOffset && scrollLeft <= maxOffset) {
          return scrollLeft;
        } else if (minOffset > maxOffset) {
          // Because we only take into account the scrollbar size when calculating minOffset
          // this value can be larger than maxOffset when at the end of the list
          return minOffset;
        } else if (scrollLeft < minOffset) {
          return minOffset;
        } else {
          return maxOffset;
        }
    }
  },

  getOffsetForRowAndAlignment: (
    { rowHeight, height, rowCount },
    rowIndex,
    align,
    scrollTop,
    instanceProps,
    scrollbarSize
  ) => {
    const lastRowOffset = Math.max(
      0,
      rowCount * ((rowHeight)) - height
    );
    const maxOffset = Math.min(
      lastRowOffset,
      rowIndex * ((rowHeight))
    );
    const minOffset = Math.max(
      0,
      rowIndex * ((rowHeight)) -
        height +
        scrollbarSize +
        ((rowHeight))
    );

    if (align === 'smart') {
      if (scrollTop >= minOffset - height && scrollTop <= maxOffset + height) {
        align = 'auto';
      } else {
        align = 'center';
      }
    }

    switch (align) {
      case 'start':
        return maxOffset;
      case 'end':
        return minOffset;
      case 'center':
        // "Centered" offset is usually the average of the min and max.
        // But near the edges of the list, this doesn't hold true.
        const middleOffset = Math.round(
          minOffset + (maxOffset - minOffset) / 2
        );
        if (middleOffset < Math.ceil(height / 2)) {
          return 0; // near the beginning
        } else if (middleOffset > lastRowOffset + Math.floor(height / 2)) {
          return lastRowOffset; // near the end
        } else {
          return middleOffset;
        }
      case 'auto':
      default:
        if (scrollTop >= minOffset && scrollTop <= maxOffset) {
          return scrollTop;
        } else if (minOffset > maxOffset) {
          // Because we only take into account the scrollbar size when calculating minOffset
          // this value can be larger than maxOffset when at the end of the list
          return minOffset;
        } else if (scrollTop < minOffset) {
          return minOffset;
        } else {
          return maxOffset;
        }
    }
  },

  getColumnStartIndexForOffset: (
    { columnWidth, columnCount },
    scrollLeft
  ) =>
    Math.max(
      0,
      Math.min(
        columnCount - 1,
        Math.floor(scrollLeft / ((columnWidth)))
      )
    ),

  getColumnStopIndexForStartIndex: (
    { columnWidth, columnCount, width },
    startIndex,
    scrollLeft
  ) => {
    const left = startIndex * ((columnWidth));
    const numVisibleColumns = Math.ceil(
      (width + scrollLeft - left) / ((columnWidth))
    );
    return Math.max(
      0,
      Math.min(
        columnCount - 1,
        startIndex + numVisibleColumns - 1 // -1 is because stop index is inclusive
      )
    );
  },

  getRowStartIndexForOffset: (
    { rowHeight, rowCount },
    scrollTop
  ) =>
    Math.max(
      0,
      Math.min(rowCount - 1, Math.floor(scrollTop / ((rowHeight))))
    ),

  getRowStopIndexForStartIndex: (
    { rowHeight, rowCount, height },
    startIndex,
    scrollTop
  ) => {
    const top = startIndex * ((rowHeight));
    const numVisibleRows = Math.ceil(
      (height + scrollTop - top) / ((rowHeight))
    );
    return Math.max(
      0,
      Math.min(
        rowCount - 1,
        startIndex + numVisibleRows - 1 // -1 is because stop index is inclusive
      )
    );
  },

  initInstanceProps(props) {
    // Noop
  },

  shouldResetStyleCacheOnItemSizeChange: true,

  validateProps: ({ columnWidth, rowHeight }) => {
    if (process.env.NODE_ENV !== 'production') {
      if (typeof columnWidth !== 'number') {
        throw Error(
          'An invalid "columnWidth" prop has been specified. ' +
            'Value should be a number. ' +
            `"${
              columnWidth === null ? 'null' : typeof columnWidth
            }" was specified.`
        );
      }

      if (typeof rowHeight !== 'number') {
        throw Error(
          'An invalid "rowHeight" prop has been specified. ' +
            'Value should be a number. ' +
            `"${rowHeight === null ? 'null' : typeof rowHeight}" was specified.`
        );
      }
    }
  },
};

export default FixedSizeGridSpecificProps;
