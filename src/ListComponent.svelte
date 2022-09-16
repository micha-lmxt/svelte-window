<script context="module">
    // Ported from "react-window@1.8.6"
    // Copyright (c) 2018 Brian Vaughn
    const IS_SCROLLING_DEBOUNCE_INTERVAL = 150;

    const defaultItemKey = (index, data) =>
        index;

    // In DEV mode, this Set helps us only log a warning once per component instance.
    // This avoids spamming the console every time a render happens.
 
    // NOTE: I considered further wrapping individual items with a pure ListItem component.
    // This would avoid ever calling the render function for the same index more than once,
    // But it would also add the overhead of a lot of components/fibers.
    // I assume people already do this (render function returning a class component),
    // So my doing it would just unnecessarily double the wrappers.
   
</script>

<script>
    import { onMount, afterUpdate, onDestroy } from "svelte";
    import { cancelTimeout, requestTimeout } from "./timer";
    import { getRTLOffsetType } from "./domHelpers";
    // normal props
    export let className = undefined,
        direction = "ltr",
        height = undefined,
        initialScrollOffset = undefined,
        innerRef = undefined,
        innerElementType = undefined,
        innerTagName = undefined,
        itemCount = undefined,
        itemData = undefined,
        itemKey = undefined,
        itemSize = undefined,
        layout = "vertical",
        onItemsRendered = undefined,
        onScroll = undefined,
        outerRef = undefined,
        outerElementType = undefined,
        outerTagName = undefined,
        overscanCount = 2,
        style = undefined,
        useIsScrolling = false,
        width = undefined;
    // specific function props
    export let specificFunctionProps;
    const {
        getItemOffset,
        getEstimatedTotalSize,
        getItemSize,
        getOffsetForIndexAndAlignment,
        getStartIndexForOffset,
        getStopIndexForStartIndex,
        initInstanceProps,
        shouldResetStyleCacheOnItemSizeChange,
        validateProps,
    } = specificFunctionProps;
    // state
    let isScrolling = false,
        scrollDirection = "forward",
        scrollOffset =
            typeof initialScrollOffset === "number" ? initialScrollOffset : 0,
        scrollUpdateWasRequested = false;

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
    export const instance = { _getItemStyleCache: _getItemStyleCache };

    let state;
    $: state = {
        instance,
        isScrolling,
        scrollDirection,
        scrollOffset,
        scrollUpdateWasRequested,
    };
    let props;
    $: props = {
        className,
        direction,
        height,
        initialScrollOffset,
        //innerRef,
        innerElementType,
        innerTagName,
        itemCount,
        itemData,
        itemKey,
        itemSize,
        layout,
        onItemsRendered,
        onScroll,
        //outerRef,
        outerElementType,
        outerTagName,
        overscanCount,
        style,
        useIsScrolling,
        width,
    };
    // class member
    let _instanceProps = initInstanceProps(
            Object.assign({ estimatedItemSize: undefined }, props),
            instance
        ),
        _resetIsScrollingTimeoutId = null;

    // need extra rollup plugin to have access to process.env, so remove it for now
    //$: validateSharedProps(props, state);
    //$: validateProps(props);

    let request_resetIsScrollingDebounced = false;

    export const scrollTo = (scrollOffset_) => {
        scrollOffset_ = Math.max(0, scrollOffset_);

        if (scrollOffset !== scrollOffset_) {
            scrollDirection =
                scrollOffset < scrollOffset_ ? "forward" : "backward";
            scrollOffset = scrollOffset_;
            scrollUpdateWasRequested = true;
        }
        request_resetIsScrollingDebounced = true;
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

    export const scrollToItem = (index, align = "auto") => {
        index = Math.max(0, Math.min(index, itemCount - 1));

        scrollTo(
            getOffsetForIndexAndAlignment(
                props,
                index,
                align,
                scrollOffset,
                _instanceProps
            )
        );
    };

    onMount(() => {
        if (typeof initialScrollOffset === "number" && outerRef != null) {
            // TODO Deprecate direction "horizontal"
            if (direction === "horizontal" || layout === "horizontal") {
                outerRef.scrollLeft = initialScrollOffset;
            } else {
                outerRef.scrollTop = initialScrollOffset;
            }
        }

        _callPropsCallbacks();
    });

    onDestroy(() => {
        if (_resetIsScrollingTimeoutId !== null) {
            cancelTimeout(_resetIsScrollingTimeoutId);
        }
    });

    // render()
    // render state vars
    let isHorizontal,
        items = [],
        estimatedTotalSize;
    $: isHorizontal = direction === "horizontal" || layout === "horizontal";

    $: onScroll_ = isHorizontal ? _onScrollHorizontal : _onScrollVertical;

    $: [startIndex, stopIndex] = _getRangeToRender(
        props,
        state,
        _instanceProps
    );
    
    const render = () => {
        items = [];

        if (itemCount > 0) {
            items.length = stopIndex - startIndex + 1;
            const itemKey_ = itemKey || defaultItemKey;
        
            let i=0;
            for (let index = startIndex; index <= stopIndex; index++) {
                items[i++] = {
                    data: itemData,
                    key: itemKey_(index, itemData),
                    index,
                    isScrolling: useIsScrolling ? isScrolling : undefined,
                    style: _getItemStyle(index),
                };
            }
        }

        // Read this value AFTER items have been created,
        // So their actual sizes (if variable) are taken into consideration.
        estimatedTotalSize = getEstimatedTotalSize(props, _instanceProps);
    }
    $: render(startIndex,stopIndex,props,_instanceProps
    );

    const _getRangeToRender = (props_, state_, _instanceProps_) => {
        const { isScrolling, scrollDirection, scrollOffset } = state_;

        if (itemCount === 0) {
            return [0, 0, 0, 0];
        }

        const startIndex = getStartIndexForOffset(
            props_,
            scrollOffset,
            _instanceProps_
        );
        const stopIndex = getStopIndexForStartIndex(
            props_,
            startIndex,
            scrollOffset,
            _instanceProps_
        );

        // Overscan by one item in each direction so that tab/focus works.
        // If there isn't at least one extra item, tab loops back around.
        const overscanBackward =
            !isScrolling || scrollDirection === "backward"
                ? Math.max(1, overscanCount)
                : 1;
        const overscanForward =
            !isScrolling || scrollDirection === "forward"
                ? Math.max(1, overscanCount)
                : 1;

        return [
            Math.max(0, startIndex - overscanBackward),
            Math.max(0, Math.min(itemCount - 1, stopIndex + overscanForward)),
            startIndex,
            stopIndex,
        ];
    };

    let _onItemsRenderedCache = {},
        _onScrollCache = {};
    const _callPropsCallbacks = () => {
        if (typeof onItemsRendered === "function") {
            if (itemCount > 0) {
                const ch = _onItemsRenderedCache;
                const [
                    overscanStartIndex,
                    overscanStopIndex,
                    visibleStartIndex,
                    visibleStopIndex,
                ] = _getRangeToRender(props, state, _instanceProps);
                if (
                    ch.overscanStartIndex !== overscanStartIndex ||
                    ch.overscanStopIndex !== overscanStopIndex ||
                    ch.visibleStartIndex !== visibleStartIndex ||
                    ch.visibleStopIndex !== visibleStopIndex
                ) {
                    onItemsRendered({
                        overscanStartIndex,
                        overscanStopIndex,
                        visibleStartIndex,
                        visibleStopIndex
                    });
                    _onItemsRenderedCache = {
                        overscanStartIndex,
                        overscanStopIndex,
                        visibleStartIndex,
                        visibleStopIndex,
                    };
                }
            }
        }
        const ch = _onScrollCache;
        if (
            typeof onScroll === "function" &&
            (scrollDirection !== ch.scrollDirection ||
                scrollOffset !== ch.scrollOffset ||
                scrollUpdateWasRequested !== ch.scrollUpdateWasRequested)
        ) {
            onScroll({scrollDirection, scrollOffset, scrollUpdateWasRequested});
            _onScrollCache = {
                scrollOffset,
                scrollDirection,
                scrollUpdateWasRequested,
            };
        }
    };

    // Lazily create and cache item styles while scrolling,
    // So that pure component sCU will prevent re-renders.
    // We maintain this cache, and pass a style prop rather than index,
    // So that List can clear cached styles and force item re-render if necessary.
    const _getItemStyle = (index) => {
        const itemStyleCache = _getItemStyleCache(
            shouldResetStyleCacheOnItemSizeChange && itemSize,
            shouldResetStyleCacheOnItemSizeChange && layout,
            shouldResetStyleCacheOnItemSizeChange && direction
        );

        let style_;
        if (itemStyleCache.hasOwnProperty(index)) {
            style_ = itemStyleCache[index];
        } else {
            const offset = getItemOffset(props, index, _instanceProps);
            const size = getItemSize(props, index, _instanceProps);

            // TODO Deprecate direction "horizontal"
            const isHorizontal =
                direction === "horizontal" || layout === "horizontal";

            const isRtl = direction === "rtl";
            const offsetHorizontal = isHorizontal ? offset : 0;
            itemStyleCache[index] = style_ = {
                position: "absolute",
                left: isRtl ? undefined : offsetHorizontal,
                right: isRtl ? offsetHorizontal : undefined,
                top: !isHorizontal ? offset : 0,
                height: !isHorizontal ? size : "100%",
                width: isHorizontal ? size : "100%",
            };
        }

        return style_;
    };

    const _onScrollHorizontal = (event) => {
        const { clientWidth, scrollLeft, scrollWidth } = event.currentTarget;
        request_resetIsScrollingDebounced = true;

        if (scrollOffset === scrollLeft) {
            // Scroll position may have been updated by cDM/cDU,
            // In which case we don't need to trigger another render,
            // And we don't want to update state.isScrolling.
            return null;
        }

        let scrollOffset_ = scrollLeft;
        if (direction === "rtl") {
            // TRICKY According to the spec, scrollLeft should be negative for RTL aligned elements.
            // This is not the case for all browsers though (e.g. Chrome reports values as positive, measured relative to the left).
            // It's also easier for this component if we convert offsets to the same format as they would be in for ltr.
            // So the simplest solution is to determine which browser behavior we're dealing with, and convert based on it.
            switch (getRTLOffsetType()) {
                case "negative":
                    scrollOffset_ = -scrollLeft;
                    break;
                case "positive-descending":
                    scrollOffset_ = scrollWidth - clientWidth - scrollLeft;
                    break;
            }
        }

        // Prevent Safari's elastic scrolling from causing visual shaking when scrolling past bounds.
        scrollOffset_ = Math.max(
            0,
            Math.min(scrollOffset_, scrollWidth - clientWidth)
        );

        isScrolling = true;
        (scrollDirection = scrollOffset < scrollLeft ? "forward" : "backward"),
            (scrollOffset = scrollOffset_);
        scrollUpdateWasRequested = false;
    };

    const _onScrollVertical = (event) => {
        const { clientHeight, scrollHeight, scrollTop } = event.currentTarget;

        request_resetIsScrollingDebounced = true;

        if (scrollOffset === scrollTop) {
            // Scroll position may have been updated by cDM/cDU,
            // In which case we don't need to trigger another render,
            // And we don't want to update state.isScrolling.
            return null;
        }

        // Prevent Safari's elastic scrolling from causing visual shaking when scrolling past bounds.
        const scrollOffset_ = Math.max(
            0,
            Math.min(scrollTop, scrollHeight - clientHeight)
        );

        isScrolling = true;
        scrollDirection = scrollOffset < scrollOffset_ ? "forward" : "backward";
        scrollOffset = scrollOffset_;
        scrollUpdateWasRequested = false;
    };

    let request_getItemStyleCache = false;

    const _resetIsScrolling = () => {
        _resetIsScrollingTimeoutId = null;

        isScrolling = false;
        request_getItemStyleCache = true;
    };

    afterUpdate(() => {
        if (request_resetIsScrollingDebounced) {
            request_resetIsScrollingDebounced = false;
            _resetIsScrollingDebounced();
        }

        if (request_getItemStyleCache) {
            request_getItemStyleCache = false;
            _getItemStyleCache(-1, null);
        }

        if (scrollUpdateWasRequested && outerRef != null) {
            // TODO Deprecate direction "horizontal"
            if (direction === "horizontal" || layout === "horizontal") {
                if (direction === "rtl") {
                    // TRICKY According to the spec, scrollLeft should be negative for RTL aligned elements.
                    // This is not the case for all browsers though (e.g. Chrome reports values as positive, measured relative to the left).
                    // So we need to determine which browser behavior we're dealing with, and mimic it.
                    switch (getRTLOffsetType()) {
                        case "negative":
                            outerRef.scrollLeft = -scrollOffset;
                            break;
                        case "positive-ascending":
                            outerRef.scrollLeft = scrollOffset;
                            break;
                        default:
                            const { clientWidth, scrollWidth } = outerRef;
                            outerRef.scrollLeft =
                                scrollWidth - clientWidth - scrollOffset;
                            break;
                    }
                } else {
                    outerRef.scrollLeft = scrollOffset;
                }
            } else {
                outerRef.scrollTop = scrollOffset;
            }
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
    class={'outerElement' + (className ? ' ' + className : '')}
    style="height:{typeof height === 'number' ? height + 'px' : height};width:{typeof width === 'number' ? width + 'px' : width};direction:{direction};{style || ''}"
    bind:this={outerRef}
    on:scroll={onScroll_}>
    <div
        bind:this={innerRef}
        style={'height: ' + (isHorizontal ? '100%;' : estimatedTotalSize + 'px;') + (isScrolling ? "pointer-events: 'none';" : '') + 'width: ' + (isHorizontal ? estimatedTotalSize + 'px;' : '100%;')}>
        <slot {items} />
    </div>
</div>
