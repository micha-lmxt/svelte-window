<script context="module">
    // Ported from "react-window@1.8.6"
    // Copyright (c) 2018 Brian Vaughn
    const IS_SCROLLING_DEBOUNCE_INTERVAL = 150;
    const defaultItemKey = ({ columnIndex, data, rowIndex }) =>
        `${rowIndex}:${columnIndex}`;

    //
    // In DEV mode, this Set helps us only log a warning once per component instance.
    // This avoids spamming the console every time a render happens.
    /*
let devWarningsOverscanCount = null;
let devWarningsOverscanRowsColumnsCount = null;
let devWarningsTagName = null;
if (process.env.NODE_ENV !== 'production') {
  if (typeof window !== 'undefined' && typeof window.WeakSet !== 'undefined') {
    devWarningsOverscanCount = new WeakSet();
    devWarningsOverscanRowsColumnsCount = new WeakSet();
    devWarningsTagName = new WeakSet();
  }
}
*/
</script>

<script>
    import { onMount, onDestroy, afterUpdate } from "svelte";
    import { cancelTimeout, requestTimeout } from "./timer";
    import { getScrollbarSize, getRTLOffsetType } from "./domHelpers";

    export let className = undefined;
    export let columnCount = undefined;
    export let columnWidth = undefined;
    export let direction = "ltr";
    export let height = undefined;
    export let initialScrollLeft = undefined;
    export let initialScrollTop = undefined;
    export let innerRef = undefined;
    export let innerElementType = undefined;
    export let innerTagName = undefined; // deprecated
    export let itemData = undefined;
    export let itemKey = undefined;
    export let onItemsRendered = undefined;
    export let onScroll = undefined;
    export let outerRef = null;
    export let outerElementType = undefined;
    export let outerTagName = undefined; // deprecated
    export let overscanColumnCount = undefined;
    export let overscanColumnsCount = undefined; // deprecated
    export let overscanCount = undefined; // deprecated
    export let overscanRowCount = undefined;
    export let overscanRowsCount = undefined; // deprecated
    export let rowCount = undefined;
    export let rowHeight = undefined;
    export let style = undefined;
    export let useIsScrolling = false;
    export let width = undefined;

    //outer props
    export let specificFunctionProps;
    const {
        getColumnOffset,
        getColumnStartIndexForOffset,
        getColumnStopIndexForStartIndex,
        getColumnWidth,
        getEstimatedTotalHeight,
        getEstimatedTotalWidth,
        getOffsetForColumnAndAlignment,
        getOffsetForRowAndAlignment,
        getRowHeight,
        getRowOffset,
        getRowStartIndexForOffset,
        getRowStopIndexForStartIndex,
        initInstanceProps,
        shouldResetStyleCacheOnItemSizeChange,
        validateProps,
    } = specificFunctionProps;

    let _styleCache = {},
        _styleCacheCheck = {};

    export const _getItemStyleCache = (a, b, c) => {
        if (
            a === _styleCacheCheck.a &&
            b === _styleCacheCheck.b &&
            c === _styleCacheCheck.c
        ) {
            return _styleCache;
        }
        _styleCacheCheck = { a, b, c };
        _styleCache = {};
        return _styleCache;
    };
    //export const _getItemStyleCache = memoizeOne((_, __, ___) => ({}));
    export const instance = { _getItemStyleCache: _getItemStyleCache };

    let props;

    $: props = {
            className,
            columnCount,
            columnWidth,
            direction,
            height,
            initialScrollLeft,
            initialScrollTop,
            //innerRef,
            innerElementType,
            innerTagName, // deprecated
            itemData,
            itemKey,
            onItemsRendered,
            onScroll,
            //outerRef,
            outerElementType,
            outerTagName, // deprecated
            overscanColumnCount,
            overscanColumnsCount, // deprecated
            overscanCount, // deprecated
            overscanRowCount,
            overscanRowsCount, // deprecated
            rowCount,
            rowHeight,
            style,
            useIsScrolling,
            width,
        };
    

    // State
    let isScrolling = false,
        horizontalScrollDirection = "forward",
        scrollLeft =
            typeof initialScrollLeft === "number" ? initialScrollLeft : 0,
        scrollTop = typeof initialScrollTop === "number" ? initialScrollTop : 0,
        scrollUpdateWasRequested = false,
        verticalScrollDirection = "forward",
        // class member
        _instanceProps,
        _resetIsScrollingTimeoutId = null;

    $: _instanceProps = instance && initInstanceProps(props, instance);

    // other states
    let request_resetIsScrollingDebounced = false,
        request_getItemStyleCache = false,
        // render state
        items = [],
        estimatedTotalHeight,
        estimatedTotalWidth;

    export const scrollTo = ({
        scrollLeft: scrollLeft_,
        scrollTop: scrollTop_,
    }) => {
        request_resetIsScrollingDebounced = true;

        if (scrollLeft_ !== undefined) {
            scrollLeft_ = Math.max(0, scrollLeft_);
        }
        if (scrollTop_ !== undefined) {
            scrollTop_ = Math.max(0, scrollTop_);
        }

        if (scrollLeft_ === undefined) {
            scrollLeft_ = scrollLeft;
        }
        if (scrollTop_ === undefined) {
            scrollTop_ = scrollTop;
        }

        if (scrollLeft === scrollLeft_ && scrollTop === scrollTop_) {
            return null;
        }

        horizontalScrollDirection =
            scrollLeft < scrollLeft_ ? "forward" : "backward";
        scrollLeft = scrollLeft_;
        scrollTop = scrollTop_;
        scrollUpdateWasRequested = true;
        verticalScrollDirection =
            scrollTop < scrollTop_ ? "forward" : "backward";
    };

    export const scrollToItem = ({ align = "auto", columnIndex, rowIndex }) => {
        const scrollbarSize = getScrollbarSize();

        if (columnIndex !== undefined) {
            columnIndex = Math.max(0, Math.min(columnIndex, columnCount - 1));
        }
        if (rowIndex !== undefined) {
            rowIndex = Math.max(0, Math.min(rowIndex, rowCount - 1));
        }

        const estimatedTotalHeight = getEstimatedTotalHeight(
            props,
            _instanceProps
        );
        const estimatedTotalWidth = getEstimatedTotalWidth(
            props,
            _instanceProps
        );

        // The scrollbar size should be considered when scrolling an item into view,
        // to ensure it's fully visible.
        // But we only need to account for its size when it's actually visible.
        const horizontalScrollbarSize =
            estimatedTotalWidth > width ? scrollbarSize : 0;
        const verticalScrollbarSize =
            estimatedTotalHeight > height ? scrollbarSize : 0;

        scrollTo({
            scrollLeft:
                columnIndex !== undefined
                    ? getOffsetForColumnAndAlignment(
                          props,
                          columnIndex,
                          align,
                          scrollLeft,
                          _instanceProps,
                          verticalScrollbarSize
                      )
                    : scrollLeft,
            scrollTop:
                rowIndex !== undefined
                    ? getOffsetForRowAndAlignment(
                          props,
                          rowIndex,
                          align,
                          scrollTop,
                          _instanceProps,
                          horizontalScrollbarSize
                      )
                    : scrollTop,
        });
    };

    onMount(() => {
        if (outerRef != null) {
            if (typeof initialScrollLeft === "number") {
                outerRef.scrollLeft = initialScrollLeft;
            }
            if (typeof initialScrollTop === "number") {
                outerRef.scrollTop = initialScrollTop;
            }
        }

        _callPropsCallbacks();
    });

    onDestroy(() => {
        if (_resetIsScrollingTimeoutId !== null) {
            cancelTimeout(_resetIsScrollingTimeoutId);
        }
    });

    // render

    $: itemKey_ = itemKey || defaultItemKey;

    
    let columnStartIndex,columnStopIndex,rowStartIndex,rowStopIndex;
    $:[columnStartIndex, columnStopIndex] = _getHorizontalRangeToRender(
        props,
        scrollLeft,
        horizontalScrollDirection
    );
    
    
    
    $: [rowStartIndex, rowStopIndex] = _getVerticalRangeToRender(
        props,
        scrollTop,
        verticalScrollDirection
    )



    $: isScrollingRender = useIsScrolling ? isScrolling : undefined;
    const render = () => {
        if (columnCount > 0 && rowCount) {
            items.length =
                (rowStopIndex - rowStartIndex + 1) *
                (columnStopIndex - columnStartIndex + 1);
            let i = 0;
            for (
                let rowIndex = rowStartIndex;
                rowIndex <= rowStopIndex;
                rowIndex++
            ) {
                for (
                    let columnIndex = columnStartIndex;
                    columnIndex <= columnStopIndex;
                    columnIndex++
                ) {
                    items[i++] = {
                        columnIndex,
                        data: itemData,
                        isScrolling: isScrollingRender,
                        key: itemKey_({
                            columnIndex,
                            data: itemData,
                            rowIndex,
                        }),
                        rowIndex,
                        style: _getItemStyle(rowIndex, columnIndex),
                    };
                }
            }
        }
        // Read this value AFTER items have been created,
        // So their actual sizes (if variable) are taken into consideration.
        estimatedTotalHeight = getEstimatedTotalHeight(props, _instanceProps);
        estimatedTotalWidth = getEstimatedTotalWidth(props, _instanceProps);
    };
    $: {
        render(
            columnStartIndex,
            columnStopIndex,
            rowStartIndex,
            rowStopIndex,
            columnCount,
            columnWidth,
            height,
            innerElementType,
            innerTagName,
            itemData,
            itemKey,
            outerElementType,
            outerTagName,
            rowCount,
            rowHeight,
            useIsScrolling,
            width
        );

    }

    let _onItemsRenderedCache = {},
        _onScrollCache = {};

    const _callPropsCallbacks = () => {
        if (typeof onItemsRendered === "function") {
            if (columnCount > 0 && rowCount > 0) {
                const [
                    overscanColumnStartIndex,
                    overscanColumnStopIndex,
                    visibleColumnStartIndex,
                    visibleColumnStopIndex,
                ] = _getHorizontalRangeToRender();
                const [
                    overscanRowStartIndex,
                    overscanRowStopIndex,
                    visibleRowStartIndex,
                    visibleRowStopIndex,
                ] = _getVerticalRangeToRender();
                const ch = _onItemsRenderedCache;
                if (
                    overscanColumnStartIndex !== ch.overscanColumnStartIndex ||
                    overscanColumnStopIndex !== ch.overscanColumnStopIndex ||
                    overscanRowStartIndex !== ch.overscanRowStartIndex ||
                    overscanRowStopIndex !== ch.overscanRowStopIndex ||
                    visibleColumnStartIndex !== ch.visibleColumnStartIndex ||
                    visibleColumnStopIndex !== ch.visibleColumnStopIndex ||
                    visibleRowStartIndex !== ch.visibleRowStartIndex ||
                    visibleRowStopIndex !== ch.visibleRowStopIndex
                ) {
                    onItemsRendered({
                        overscanColumnStartIndex,
                        overscanColumnStopIndex,
                        overscanRowStartIndex,
                        overscanRowStopIndex,
                        visibleColumnStartIndex,
                        visibleColumnStopIndex,
                        visibleRowStartIndex,
                        visibleRowStopIndex
                    });
                    _onItemsRenderedCache = {
                        overscanColumnStartIndex,
                        overscanColumnStopIndex,
                        overscanRowStartIndex,
                        overscanRowStopIndex,
                        visibleColumnStartIndex,
                        visibleColumnStopIndex,
                        visibleRowStartIndex,
                        visibleRowStopIndex
                    };
                }
            }
        }
        const ch = _onScrollCache;
        if (
            typeof onScroll === "function" &&
            !(
                scrollLeft === ch.scrollLeft &&
                scrollTop === ch.scrollTop &&
                horizontalScrollDirection === ch.horizontalScrollDirection &&
                verticalScrollDirection === ch.verticalScrollDirection &&
                scrollUpdateWasRequested === scrollUpdateWasRequested
            )
        ) {
            onScroll({
                scrollLeft,
                scrollTop,
                horizontalScrollDirection,
                verticalScrollDirection,
                scrollUpdateWasRequested
            });
            _onScrollCache = {
                scrollLeft,
                scrollTop,
                horizontalScrollDirection,
                verticalScrollDirection,
                scrollUpdateWasRequested
            };
        }
    };

    // Lazily create and cache item styles while scrolling,
    // So that pure component sCU will prevent re-renders.
    // We maintain this cache, and pass a style prop rather than index,
    // So that List can clear cached styles and force item re-render if necessary.
    const _getItemStyle = (rowIndex, columnIndex) => {
        const itemStyleCache = _getItemStyleCache(
            shouldResetStyleCacheOnItemSizeChange && columnWidth,
            shouldResetStyleCacheOnItemSizeChange && direction,
            shouldResetStyleCacheOnItemSizeChange && rowHeight
        );

        const key = `${rowIndex}:${columnIndex}`;

        let style;
        if (itemStyleCache.hasOwnProperty(key)) {
            style = itemStyleCache[key];
        } else {
            const offset = getColumnOffset(props, columnIndex, _instanceProps);
            const isRtl = direction === "rtl";
            itemStyleCache[key] = style = {
                position: "absolute",
                left: isRtl ? undefined : offset,
                right: isRtl ? offset : undefined,
                top: getRowOffset(props, rowIndex, _instanceProps),
                height: getRowHeight(props, rowIndex, _instanceProps),
                width: getColumnWidth(props, columnIndex, _instanceProps),
            };
        }

        return style;
    };

    const _getHorizontalRangeToRender = () => {
        const overscanCountResolved =
            overscanColumnCount || overscanColumnsCount || overscanCount || 1;

        if (columnCount === 0 || rowCount === 0) {
            return [0, 0, 0, 0];
        }

        const startIndex = getColumnStartIndexForOffset(
            props,
            scrollLeft,
            _instanceProps
        );
        const stopIndex = getColumnStopIndexForStartIndex(
            props,
            startIndex,
            scrollLeft,
            _instanceProps
        );

        // Overscan by one item in each direction so that tab/focus works.
        // If there isn't at least one extra item, tab loops back around.
        const overscanBackward =
            !isScrolling || horizontalScrollDirection === "backward"
                ? Math.max(1, overscanCountResolved)
                : 1;
        const overscanForward =
            !isScrolling || horizontalScrollDirection === "forward"
                ? Math.max(1, overscanCountResolved)
                : 1;

        return [
            Math.max(0, startIndex - overscanBackward),
            Math.max(0, Math.min(columnCount - 1, stopIndex + overscanForward)),
            startIndex,
            stopIndex,
        ];
    };

    const _getVerticalRangeToRender = () => {
        const overscanCountResolved =
            overscanRowCount || overscanRowsCount || overscanCount || 1;

        if (columnCount === 0 || rowCount === 0) {
            return [0, 0, 0, 0];
        }

        const startIndex = getRowStartIndexForOffset(
            props,
            scrollTop,
            _instanceProps
        );
        const stopIndex = getRowStopIndexForStartIndex(
            props,
            startIndex,
            scrollTop,
            _instanceProps
        );

        // Overscan by one item in each direction so that tab/focus works.
        // If there isn't at least one extra item, tab loops back around.
        const overscanBackward =
            !isScrolling || verticalScrollDirection === "backward"
                ? Math.max(1, overscanCountResolved)
                : 1;
        const overscanForward =
            !isScrolling || verticalScrollDirection === "forward"
                ? Math.max(1, overscanCountResolved)
                : 1;

        return [
            Math.max(0, startIndex - overscanBackward),
            Math.max(0, Math.min(rowCount - 1, stopIndex + overscanForward)),
            startIndex,
            stopIndex,
        ];
    };

    const _onScroll = (event) => {
        const {
            clientHeight,
            clientWidth,
            scrollLeft: scrollLeft_,
            scrollTop: scrollTop_,
            scrollHeight,
            scrollWidth,
        } = event.currentTarget;
        request_resetIsScrollingDebounced = true;

        if (scrollLeft === scrollLeft_ && scrollTop === scrollTop_) {
            // Scroll position may have been updated by cDM/cDU,
            // In which case we don't need to trigger another render,
            // And we don't want to update state.isScrolling.
            return null;
        }

        // TRICKY According to the spec, scrollLeft should be negative for RTL aligned elements.
        // This is not the case for all browsers though (e.g. Chrome reports values as positive, measured relative to the left).
        // It's also easier for this component if we convert offsets to the same format as they would be in for ltr.
        // So the simplest solution is to determine which browser behavior we're dealing with, and convert based on it.
        let calculatedScrollLeft = scrollLeft_;
        if (direction === "rtl") {
            switch (getRTLOffsetType()) {
                case "negative":
                    calculatedScrollLeft = -scrollLeft_;
                    break;
                case "positive-descending":
                    calculatedScrollLeft =
                        scrollWidth - clientWidth - scrollLeft_;
                    break;
            }
        }

        // Prevent Safari's elastic scrolling from causing visual shaking when scrolling past bounds.
        calculatedScrollLeft = Math.max(
            0,
            Math.min(calculatedScrollLeft, scrollWidth - clientWidth)
        );
        const calculatedscrollTop = Math.max(
            0,
            Math.min(scrollTop_, scrollHeight - clientHeight)
        );

        isScrolling = true;
        horizontalScrollDirection =
            scrollLeft < scrollLeft_ ? "forward" : "backward";
        scrollLeft = calculatedScrollLeft;
        scrollTop = calculatedscrollTop;
        verticalScrollDirection =
            scrollTop < scrollTop_ ? "forward" : "backward";
        scrollUpdateWasRequested = false;
    };

    const _resetIsScrollingDebounced = () => {
        if (_resetIsScrollingTimeoutId !== null) {
            cancelTimeout(_resetIsScrollingTimeoutId);
        }

        _resetIsScrollingTimeoutId = requestTimeout(
            _resetIsScrolling,
            IS_SCROLLING_DEBOUNCE_INTERVAL
        );
    };

    const _resetIsScrolling = () => {
        _resetIsScrollingTimeoutId = null;

        isScrolling = false;
        verticalScrollDirection = "";
        horizontalScrollDirection = "";
        request_getItemStyleCache = true;
    };

    afterUpdate(() => {
        if (request_resetIsScrollingDebounced) {
            request_resetIsScrollingDebounced = false;
            _resetIsScrollingDebounced();
        }
        if (request_getItemStyleCache) {
            request_getItemStyleCache = false;
            // Clear style cache after state update has been committed.
            // This way we don't break pure sCU for items that don't use isScrolling param.
            _getItemStyleCache(-1);
        }

        if (scrollUpdateWasRequested && outerRef != null) {
            // TRICKY According to the spec, scrollLeft should be negative for RTL aligned elements.
            // This is not the case for all browsers though (e.g. Chrome reports values as positive, measured relative to the left).
            // So we need to determine which browser behavior we're dealing with, and mimic it.

            if (direction === "rtl") {
                switch (getRTLOffsetType()) {
                    case "negative":
                        outerRef.scrollLeft = -scrollLeft;
                        break;
                    case "positive-ascending":
                        outerRef.scrollLeft = scrollLeft;
                        break;
                    default:
                        const { clientWidth, scrollWidth } = outerRef;
                        outerRef.scrollLeft =
                            scrollWidth - clientWidth - scrollLeft;
                        break;
                }
            } else {
                outerRef.scrollLeft = Math.max(0, scrollLeft);
            }

            outerRef.scrollTop = Math.max(0, scrollTop);
        }

        _callPropsCallbacks();
    });
</script>

<style>
    .outerElement {
        position: relative;
        overflow: auto;
        -webkit-overflow-scrolling: touch;
        will-change: transform;
    }
</style>

<div
    class={className}
    class:outerElement={true}
    on:scroll={_onScroll}
    bind:this={outerRef}
    style="height:{typeof height === 'number' ? height + 'px' : height};width:{typeof width === 'number' ? width + 'px' : width};direction:{direction};{style || ''}">
    <div
        bind:this={innerRef}
        style={'height: ' + estimatedTotalHeight + 'px;' + (isScrolling ? "pointer-events: 'none';" : '') + 'width: ' + estimatedTotalWidth + 'px;'}>
        <slot {items} />
    </div>
</div>
