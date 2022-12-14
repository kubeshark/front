import React, { useEffect, useState } from "react";
import style from './LoadingOverlay.module.sass';

const SpinnerShowDelayMs = 350;

interface LoadingOverlayProps {
  delay?: number
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ delay }) => {

  const [isVisible, setIsVisible] = useState(false);

  // @ts-expect-error: Boolean?
  useEffect(() => {
    let isRelevant = true;

    setTimeout(() => {
      if (isRelevant)
        setIsVisible(true);
    }, delay || SpinnerShowDelayMs);

    return () => isRelevant = false;
  }, [delay]);

  return <div className={style.loadingOverlayContainer} hidden={!isVisible}>
    <div className={style.loadingOverlaySpinner} />
  </div>
};

export default LoadingOverlay;
