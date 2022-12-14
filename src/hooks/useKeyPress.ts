import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

const useKeyPress = (eventConfigs: unknown, callback: unknown, node = null): void => {
  // implement the callback ref pattern
  const callbackRef = useRef(callback);
  useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  // handle what happens on key press
  const handleKeyPress = useCallback(
    (event) => {

      // check if one of the key is part of the ones we want
      // @ts-expect-error: Some?
      if (eventConfigs.some((eventConfig) => Object.keys(eventConfig).every(nameKey => eventConfig[nameKey] === event[nameKey]))) {
        event.stopPropagation()
        event.preventDefault();
        // @ts-expect-error: Some?
        callbackRef.current(event);
      }
    },
    [eventConfigs]
  );

  useEffect(() => {
    // target is either the provided node or the document
    const targetNode = node || document;
    // attach the event listener
    targetNode &&
      targetNode.addEventListener("keydown", handleKeyPress);

    // remove the event listener
    return () =>
      targetNode &&
      targetNode.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress, node]);
};

export default useKeyPress;
