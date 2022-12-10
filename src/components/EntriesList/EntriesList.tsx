import React, { useCallback, useEffect, useMemo, useState } from "react";
import styles from './EntriesList.module.sass';
import ScrollableFeedVirtualized from "react-scrollable-feed-virtualized";
import { Entry, EntryItem } from "../EntryListItem/EntryListItem";
import down from "./assets/downImg.svg";
import spinner from "./assets/spinner.svg";
import { RecoilState, useRecoilState, useRecoilValue } from "recoil";
import entriesAtom from "../../recoil/entries";
import queryAtom from "../../recoil/query";
import TrafficViewerApiAtom from "../../recoil/TrafficViewerApi";
import TrafficViewerApi from "../TrafficViewer/TrafficViewerApi";
import focusedEntryIdAtom from "../../recoil/focusedEntryId";
import focusedEntryWorkerAtom from "../../recoil/focusedEntryWorker";
import { MAX_ENTRIES } from "../../configs/Consts";
import leftOffTopAtom from "../../recoil/leftOffTop";
import Moment from "moment";

interface EntriesListProps {
  listEntryREF: React.LegacyRef<HTMLDivElement>;
  onSnapBrokenEvent: () => void;
  isSnappedToBottom: boolean;
  setIsSnappedToBottom: (state: boolean) => void;
  noMoreDataTop: boolean;
  setNoMoreDataTop: (flag: boolean) => void;
  openWebSocket: (leftOff: string, query: string, resetEntries: boolean, fetch: number, fetchTimeoutMs: number) => void;
  scrollableRef: React.MutableRefObject<ScrollableFeedVirtualized>;
  ws: React.MutableRefObject<WebSocket>;
}

interface ScrollerElement {
  scrollTop?: number;
}

interface DataModel {
  length: number;
  reverse: () => unknown[];
}

interface MetaModel {
  leftOff: string;
  noMoreData: boolean;
  total: number;
  truncatedTimestamp: number;
}

export interface FetchModel {
  data: DataModel;
  meta: MetaModel;
}

export const EntriesList: React.FC<EntriesListProps> = ({
  listEntryREF,
  onSnapBrokenEvent,
  isSnappedToBottom,
  setIsSnappedToBottom,
  noMoreDataTop,
  setNoMoreDataTop,
  openWebSocket,
  scrollableRef,
  ws
}) => {

  const [entries, setEntries] = useRecoilState(entriesAtom);
  const query = useRecoilValue(queryAtom);
  const isWsConnectionClosed = ws?.current?.readyState !== WebSocket.OPEN;
  const [focusedEntryId, setFocusedEntryId] = useRecoilState(focusedEntryIdAtom);
  const [focusedEntryWorker, setFocusedEntryWorker] = useRecoilState(focusedEntryWorkerAtom);
  const [leftOffTop, setLeftOffTop] = useRecoilState(leftOffTopAtom);

  const trafficViewerApi = useRecoilValue(TrafficViewerApiAtom as RecoilState<TrafficViewerApi>)

  const [loadMoreTop, setLoadMoreTop] = useState(false);
  const [isLoadingTop, setIsLoadingTop] = useState(false);
  const [queriedTotal, setQueriedTotal] = useState(0);
  const [startTime] = useState(0);
  const [truncatedTimestamp, setTruncatedTimestamp] = useState(0);

  const leftOffBottom = entries.length > 0 ? entries[entries.length - 1].id : "latest";

  useEffect(() => {
    const list = document.getElementById('list')?.firstElementChild;
    list?.addEventListener('scroll', (e) => {
      const el: ScrollerElement = e.target as ScrollerElement;
      if (el.scrollTop === 0) {
        setLoadMoreTop(true);
      } else {
        setNoMoreDataTop(false);
        setLoadMoreTop(false);
      }
    });
  }, [setLoadMoreTop, setNoMoreDataTop]);

  const memoizedEntries: Entry[] = useMemo(() => {
    return entries;
  }, [entries]);

  const getOldEntries = useCallback(async () => {
    setLoadMoreTop(false);
    if (leftOffTop === "") {
      return;
    }
    setIsLoadingTop(true);
    const data: FetchModel = await trafficViewerApi.fetchEntries(leftOffTop, -1, query, 100, 3000);
    if (!data || data.data === null || data.meta === null) {
      setNoMoreDataTop(true);
      setIsLoadingTop(false);
      return;
    }
    setLeftOffTop(data.meta.leftOff);

    let scrollTo: boolean;
    if (data.meta.noMoreData) {
      setNoMoreDataTop(true);
      scrollTo = false;
    } else {
      scrollTo = true;
    }
    setIsLoadingTop(false);

    const newEntries = [...data.data.reverse(), ...entries];
    if (newEntries.length > MAX_ENTRIES) {
      newEntries.splice(MAX_ENTRIES, newEntries.length - MAX_ENTRIES)
    }
    setEntries(newEntries);

    setQueriedTotal(data.meta.total);
    setTruncatedTimestamp(data.meta.truncatedTimestamp);

    if (scrollTo) {
      scrollableRef.current.scrollToIndex(data.data.length - 1);
    }
  }, [setLoadMoreTop, setIsLoadingTop, entries, setEntries, query, setNoMoreDataTop, leftOffTop, setLeftOffTop, setQueriedTotal, setTruncatedTimestamp, scrollableRef, trafficViewerApi]);

  useEffect(() => {
    if (!isWsConnectionClosed || !loadMoreTop || noMoreDataTop) return;
    getOldEntries();
  }, [loadMoreTop, noMoreDataTop, getOldEntries, isWsConnectionClosed]);

  // @ts-expect-error: Fields are private in the NPM package
  const scrollbarVisible = scrollableRef.current?.childWrapperRef.current.clientHeight > scrollableRef.current?.wrapperRef.current.clientHeight;

  useEffect(() => {
    if (!focusedEntryId && entries.length > 0) {
      setFocusedEntryId(entries[0].id);
      setFocusedEntryWorker(entries[0].worker);
    }
  }, [focusedEntryId, focusedEntryWorker, entries, setFocusedEntryId, setFocusedEntryWorker])

  useEffect(() => {
    const newEntries = [...entries];
    if (newEntries.length > MAX_ENTRIES) {
      setLeftOffTop(newEntries[0].id);
      newEntries.splice(0, newEntries.length - MAX_ENTRIES)
      setNoMoreDataTop(false);
      setEntries(newEntries);
    }
  }, [entries, setLeftOffTop, setNoMoreDataTop, setEntries])

  if (ws.current && !ws.current.onmessage) {
    ws.current.onmessage = (e) => {
      if (!e?.data) return;
      const message = JSON.parse(e.data);
      setEntries(entriesState => [...entriesState, message]);
    }
  }

  return <React.Fragment>
    <div className={styles.list}>
      <div id="list" ref={listEntryREF} className={styles.list}>
        {isLoadingTop && <div className={styles.spinnerContainer}>
          <img alt="spinner" src={spinner} style={{ height: 25 }} />
        </div>}
        {noMoreDataTop && <div id="noMoreDataTop" className={styles.noMoreDataAvailable}>No more data available</div>}
        <ScrollableFeedVirtualized ref={scrollableRef} itemHeight={48} marginTop={10} onSnapBroken={onSnapBrokenEvent}>
          {false /* It's because the first child is ignored by ScrollableFeedVirtualized */}
          {memoizedEntries.map(entry => <EntryItem
            key={`item-${entry.worker}-${entry.id}`}
            entry={entry}
            style={{}}
            headingMode={false}
          />)}
        </ScrollableFeedVirtualized>
        <button type="button"
          title="Fetch old records"
          className={`${styles.btnOld} ${!scrollbarVisible && leftOffTop !== "" ? styles.showButton : styles.hideButton}`}
          onClick={() => {
            trafficViewerApi.webSocket.close()
            getOldEntries();
          }}>
          <img alt="down" src={down} />
        </button>
        <button type="button"
          title="Snap to bottom"
          className={`${styles.btnLive} ${isSnappedToBottom && !isWsConnectionClosed ? styles.hideButton : styles.showButton}`}
          onClick={() => {
            if (isWsConnectionClosed) {
              openWebSocket(leftOffBottom, query, false, 0, 0);
            }
            scrollableRef.current.jumpToBottom();
            setIsSnappedToBottom(true);
          }}>
          <img alt="down" src={down} />
        </button>
      </div>

      <div className={styles.footer}>
        <div>Displaying <b id="entries-length">{entries?.length > MAX_ENTRIES ? MAX_ENTRIES : entries?.length}</b> results out of <b
          id="total-entries">{queriedTotal}</b> total
        </div>
        {startTime !== 0 && <div>First traffic entry time <span style={{
          marginRight: 5,
          fontWeight: 600,
          fontSize: 13
        }}>{Moment(truncatedTimestamp ? truncatedTimestamp : startTime).utc().format('MM/DD/YYYY, h:mm:ss.SSS A')}</span>
        </div>}
      </div>
    </div>
  </React.Fragment>;
};
