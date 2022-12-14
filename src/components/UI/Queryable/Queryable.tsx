import React, { useEffect, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import QueryableStyle from './Queryable.module.sass';
import { useRecoilState } from "recoil";
import queryBuildAtom from "../../../recoil/queryBuild";

interface Props {
  query: string,
  style?: unknown,
  iconStyle?: unknown,
  className?: string,
  useTooltip?: boolean,
  tooltipStyle?: unknown,
  displayIconOnMouseOver?: boolean,
  flipped?: boolean,
}

const Queryable: React.FC<Props> = ({ query, style, iconStyle, className, useTooltip = true, tooltipStyle = null, displayIconOnMouseOver = false, flipped = false, children }) => {
  const [showAddedNotification, setAdded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [queryBuild, setQuerytemp] = useRecoilState(queryBuildAtom);

  const onCopy = () => {
    setAdded(true)
  };

  useEffect(() => {
    let timer;
    if (showAddedNotification) {
      setQuerytemp(queryBuild ? `${queryBuild} and ${query}` : query);
      timer = setTimeout(() => {
        setAdded(false);
      }, 1000);
    }
    return () => clearTimeout(timer);

    // eslint-disable-next-line
  }, [showAddedNotification, query, setQuerytemp]);

  const addButton = query ? <CopyToClipboard text={query} onCopy={onCopy}>
    <span
      className={QueryableStyle.QueryableIcon}
      title={`Add "${query}" to the filter`}
      style={iconStyle}>
      <AddCircleIcon fontSize="small" color="inherit" />
      {showAddedNotification && <span className={QueryableStyle.QueryableAddNotifier}>Added</span>}
    </span>
  </CopyToClipboard> : null;

  return (
    <div className={`${QueryableStyle.QueryableContainer} ${QueryableStyle.displayIconOnMouseOver} ${className ? className : ''} ${displayIconOnMouseOver ? QueryableStyle.displayIconOnMouseOver : ''}`}
      style={style} onMouseOver={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
      {flipped && addButton}
      {children}
      {!flipped && addButton}
      {useTooltip && showTooltip && (query !== "") && <span data-cy={"QueryableTooltip"} className={QueryableStyle.QueryableTooltip} style={tooltipStyle}>{query}</span>}
    </div>
  );
};

export default Queryable;
