import { ref, provide, computed } from 'vue';
import authToken from '@/common/authToken';
import { defineStore } from 'pinia';
import { usePositionsStore } from '@/stores/positions/positions';
import { useProfileStore } from '@/stores/profile/profile';
// import { ManageWebsocketResponse } from '@/requests/manageResponse';

export const useTickerStore = defineStore('tickers', () => {

  let ticker = null;
  const positionsStore = usePositionsStore();
  const profileStore = useProfileStore();

  let wsStatus = false;
  const lastPrices = ref({});
  const tickerList = ref([]);
  const profits = ref({});
  const candleData = ref({});
  const token = computed(() => authToken.getToken().accessToken);
  const userId = ref('');
  const isBrokerConnected = ref(false);
  // const brokerBalance = ref(null)

  const channel = new BroadcastChannel('my-channel');
  channel.addEventListener('message', (event) => {
    const message = event.data;
    if (message.type === 'logout') {
      stopWebSocket();
    }
  });

  function updateTickerList(data) {
    let newSymbols = [];
    for (let i = 0; i < data.length; i++) {
      if (!tickerList.value.includes(data[i])) {
        tickerList.value.push(data[i]?.replace(/[^A-Z0-9]/g, ''));
        newSymbols.push(data[i]?.replace(/[^A-Z0-9]/g, ''));
      }
    }

    if (token.value && ticker !== null && newSymbols.length > 0) {
      subscribe(userId.value, newSymbols);
    }
  }

  const onTicks = (ticks) => {
    const tick = ticks;

    try {
      // ManageWebsocketResponse(tick);
    } catch (error) {
      console.error("Error processing tick data:", error);
    }

    if (tick['price']) {
      updateLastPrice(tick);
    }
  };

  const startWebSocket = (user_id) => {
    if (!wsStatus) {
      console.log("Starting Socket.IO connection");

      // ticker = new MatrixTicker({
      //   token: user_id,
      //   reconnect: true,
      // });
      ticker = {
        on: () => {},
        disconnect: () => {},
        subscribe: () => {},
        unsubscribe: () => {}
      };

      userId.value = user_id;

      ticker.on("connect", () => {
        console.log("Socket connected");
      });

      subscribe(user_id);

      ticker.on('price_update', (data) => onTicks(data));

      ticker.on('position_update', () => {
        profileStore.getBrokerProfile();
        if(positionsStore.activeView === 'closed')  positionsStore.fetchClosedPositions(true);
        else positionsStore.fetchOpenPositions(true); 
      });

      // ticker.on('broker_balance_update', (data) => {
      //     brokerBalance.value = data
      // })

      // ✅ kept only this (safe)
      ticker.on('broker_connected', (data) => {
        isBrokerConnected.value = true;
        setTimeout(() => isBrokerConnected.value = false, 2000);
      });

      ticker.on("disconnect", () => {
        console.log("Socket disconnected");
        wsStatus = false;
      });

      ticker.on('plan_expired', () => {
        window.location.reload();
      });

      wsStatus = true;
    }
  };

  const stopWebSocket = () => {
    if (ticker != null) {
      ticker.disconnect();
      ticker = null;
      wsStatus = false;
    }
  };

  const subscribe = (id, symbols = tickerList.value) => {
    if (token.value && ticker && symbols.length > 0) {
      ticker.subscribe(symbols, id);
    }
  };

  const unsubscribe = (symbols) => {
    if (token.value && ticker) {
      ticker.unsubscribe(symbols, userId.value);
    }
  };

  function updateLastPrice(data) {
    const symbol = data['symbol'];
    lastPrices.value[symbol] = data['price'];
    return lastPrices.value;
  }

  const getProfit = () => {
    return profits.value['total_profit'];
  };

  // function getLatestBrokerData() {
  //   return brokerBalance.value;
  // }

  function getLastPrice(symbol) {
    return lastPrices.value[symbol] || undefined;
  }

  provide('lastPriceStore', {
    updateLastPrice,
    getProfit,
    getLastPrice,
    startWebSocket,
    stopWebSocket
  });

  return {
    unsubscribe,
    isBrokerConnected,
    subscribe,
    getProfit,
    updateLastPrice,
    getLastPrice,
    startWebSocket,
    stopWebSocket,
    updateTickerList,
    lastPrices,
    tickerList,
    candleData,
  };
});