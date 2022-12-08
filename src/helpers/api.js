import * as axios from "axios";

const hubHostPort = `${process.env.REACT_APP_HUB_HOST ? process.env.REACT_APP_HUB_HOST : "localhost"}:${process.env.REACT_APP_HUB_PORT ? process.env.REACT_APP_HUB_PORT : "8898"}`

export const KubesharkWebsocketURL = window.location.protocol === 'https:' ? `wss://${hubHostPort}/ws` : `ws://${hubHostPort}/ws`;

const CancelToken = axios.CancelToken;

const apiURL = window.location.protocol === 'https:' ? `https://${hubHostPort}/` : `http://${hubHostPort}/`;

let client = null
let source = null

export default class Api {
  static instance;

  static getInstance() {
    if (!Api.instance) {
      Api.instance = new Api();
    }
    return Api.instance;
  }

  constructor() {
    client = this.getAxiosClient();
    source = null;
  }

  serviceMapData = async () => {
    const response = await client.get(`/servicemap/get`);
    return response.data;
  }

  targetStatus = async () => {
    const response = await client.get("/status/target");
    return response.data;
  }
  getWorkerConfig = async () => {
    const response = await this.client.get("/config/worker");
    return response.data;
  }

  setWorkerConfig = async (config) => {
    const response = await this.client.post("/config/worker", {
      targettedNamespaces: config
    });
    return response.data;
  }

  getItem = async (worker, id, query) => {
    const response = await client.get(`/item/${worker}/${id}?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  fetchEntries = async (leftOff, direction, query, limit, timeoutMs) => {
    const response = await client.get(`/entries/?leftOff=${leftOff}&direction=${direction}&query=${encodeURIComponent(query)}&limit=${limit}&timeoutMs=${timeoutMs}`).catch(function (thrown) {
      console.error(thrown.message);
      return {};
    });
    return response.data;
  }

  replayRequest = async (requestData) => {
    const response = await client.post(`/replay/`, requestData);
    return response.data;
  }

  getAuthStatus = async () => {
    const response = await client.get("/status/auth");
    return response.data;
  }

  getOasServices = async () => {
    const response = await client.get("/oas/");
    return response.data;
  }

  getOasByService = async (selectedService) => {
    const response = await client.get(`/oas/${selectedService}`);
    return response.data;
  }

  gelAlloasServicesInOneSpec = async () => {
    const response = await this.client.get("/oas/all");
    return response.data;
  }

  validateQuery = async (query) => {
    if (source) {
      source.cancel();
    }
    source = CancelToken.source();

    const form = new FormData();
    form.append('query', query)
    const response = await client.post(`/query/validate`, form, {
      cancelToken: source.token
    }).catch(function (thrown) {
      if (!axios.isCancel(thrown)) {
        console.error('Validate error', thrown.message);
      }
    });

    if (!response) {
      return null;
    }

    return response.data;
  }

  getAxiosClient = () => {
    const headers = {
      Accept: "application/json"
    }
    return axios.create({
      baseURL: apiURL,
      timeout: 31000,
      headers
    });
  }

  getTrafficStats = async (startTimeMs, endTimeMs) => {
    const response = await client.get("/status/trafficStats", {
      params: {
        startTimeMs,
        endTimeMs
      }
    });
    return response.data;
  }
}
