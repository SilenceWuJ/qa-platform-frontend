import { io } from "socket.io-client";
import { ElMessage } from "element-plus";

class WebSocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.eventHandlers = new Map();
    this.rooms = new Set();
  }

  /**
   * 连接到WebSocket服务器
   */
  connect() {
    if (this.socket && this.isConnected) {
      console.log("WebSocket已经连接");
      return;
    }

    try {
      // 连接到后端WebSocket服务器
      this.socket = io("http://localhost:5000", {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });

      this.setupEventListeners();
      console.log("正在连接WebSocket服务器...");
    } catch (error) {
      console.error("WebSocket连接失败:", error);
      ElMessage.error("WebSocket连接失败");
    }
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    if (!this.socket) return;

    // 连接成功
    this.socket.on("connect", () => {
      console.log("WebSocket连接成功");
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emitEvent("connected", { timestamp: new Date().toISOString() });
      ElMessage.success("实时连接已建立");
    });

    // 连接断开
    this.socket.on("disconnect", (reason) => {
      console.log("WebSocket连接断开:", reason);
      this.isConnected = false;
      this.emitEvent("disconnected", { reason, timestamp: new Date().toISOString() });
      
      if (reason === "io server disconnect") {
        // 服务器主动断开，需要手动重连
        this.socket.connect();
      }
    });

    // 连接错误
    this.socket.on("connect_error", (error) => {
      console.error("WebSocket连接错误:", error);
      this.reconnectAttempts++;
      this.emitEvent("connect_error", { error, timestamp: new Date().toISOString() });
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        ElMessage.warning("WebSocket连接失败，请检查网络连接");
      }
    });

    // 重连成功
    this.socket.on("reconnect", (attemptNumber) => {
      console.log(`WebSocket重连成功 (尝试次数: ${attemptNumber})`);
      this.isConnected = true;
      this.emitEvent("reconnected", { attemptNumber, timestamp: new Date().toISOString() });
      
      // 重新加入之前的房间
      this.rooms.forEach((room) => {
        this.joinRoom(room);
      });
    });

    // 系统状态更新
    this.socket.on("system_status", (data) => {
      this.emitEvent("system_status", data);
    });

    // 测试执行更新
    this.socket.on("test_run_updated", (data) => {
      this.emitEvent("test_run_updated", data);
    });

    // 测试执行完成
    this.socket.on("test_run_completed", (data) => {
      this.emitEvent("test_run_completed", data);
    });

    // 执行进度更新
    this.socket.on("execution_progress", (data) => {
      this.emitEvent("execution_progress", data);
    });

    // 测试用例结果
    this.socket.on("testcase_result", (data) => {
      this.emitEvent("testcase_result", data);
    });

    // 执行完成
    this.socket.on("execution_completed", (data) => {
      this.emitEvent("execution_completed", data);
    });

    // 批量执行事件
    this.socket.on("batch_started", (data) => {
      this.emitEvent("batch_started", data);
    });

    this.socket.on("batch_progress", (data) => {
      this.emitEvent("batch_progress", data);
    });

    this.socket.on("batch_completed", (data) => {
      this.emitEvent("batch_completed", data);
    });

    this.socket.on("batch_case_started", (data) => {
      this.emitEvent("batch_case_started", data);
    });

    // 错误事件
    this.socket.on("error", (data) => {
      console.error("WebSocket错误:", data);
      this.emitEvent("error", data);
      ElMessage.error(data.message || "WebSocket错误");
    });
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.rooms.clear();
      console.log("WebSocket已断开连接");
    }
  }

  /**
   * 加入房间
   */
  joinRoom(roomName) {
    if (!this.isConnected || !this.socket) {
      console.warn("无法加入房间: WebSocket未连接");
      return false;
    }

    this.socket.emit("join_execution_room", { execution_id: roomName.replace("execution_", "") });
    this.rooms.add(roomName);
    console.log(`已加入房间: ${roomName}`);
    return true;
  }

  /**
   * 离开房间
   */
  leaveRoom(roomName) {
    if (!this.isConnected || !this.socket) {
      return false;
    }

    this.socket.emit("leave_execution_room", { execution_id: roomName.replace("execution_", "") });
    this.rooms.delete(roomName);
    console.log(`已离开房间: ${roomName}`);
    return true;
  }

  /**
   * 订阅执行记录更新
   */
  subscribeExecution(executionId) {
    if (!this.isConnected || !this.socket) {
      console.warn("无法订阅执行记录: WebSocket未连接");
      return false;
    }

    this.socket.emit("subscribe_execution", { execution_id: executionId });
    console.log(`已订阅执行记录: ${executionId}`);
    return true;
  }

  /**
   * 取消订阅执行记录
   */
  unsubscribeExecution(executionId) {
    if (!this.isConnected || !this.socket) {
      return false;
    }

    this.socket.emit("unsubscribe_execution", { execution_id: executionId });
    console.log(`已取消订阅执行记录: ${executionId}`);
    return true;
  }

  /**
   * 订阅测试执行更新
   */
  subscribeTestRuns() {
    if (!this.isConnected || !this.socket) {
      console.warn("无法订阅测试执行更新: WebSocket未连接");
      return false;
    }

    this.socket.emit("subscribe_test_runs");
    console.log("已订阅测试执行更新");
    return true;
  }

  /**
   * 取消订阅测试执行更新
   */
  unsubscribeTestRuns() {
    if (!this.isConnected || !this.socket) {
      return false;
    }

    this.socket.emit("unsubscribe_test_runs");
    console.log("已取消订阅测试执行更新");
    return true;
  }

  /**
   * 请求执行状态
   */
  requestExecutionStatus(executionId) {
    if (!this.isConnected || !this.socket) {
      console.warn("无法请求执行状态: WebSocket未连接");
      return false;
    }

    this.socket.emit("request_execution_status", { execution_id: executionId });
    console.log(`已请求执行状态: ${executionId}`);
    return true;
  }

  /**
   * 请求系统状态
   */
  requestSystemStatus() {
    if (!this.isConnected || !this.socket) {
      console.warn("无法请求系统状态: WebSocket未连接");
      return false;
    }

    this.socket.emit("request_system_status");
    console.log("已请求系统状态");
    return true;
  }

  /**
   * 注册事件处理器
   */
  on(eventName, handler) {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    this.eventHandlers.get(eventName).push(handler);
  }

  /**
   * 移除事件处理器
   */
  off(eventName, handler) {
    if (this.eventHandlers.has(eventName)) {
      const handlers = this.eventHandlers.get(eventName);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   */
  emitEvent(eventName, data) {
    if (this.eventHandlers.has(eventName)) {
      this.eventHandlers.get(eventName).forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`事件处理器错误 (${eventName}):`, error);
        }
      });
    }
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      rooms: Array.from(this.rooms),
    };
  }
}

// 创建单例实例
const websocketClient = new WebSocketClient();

/**
 * Vue composable for using WebSocket
 * @returns {Object} WebSocket methods
 */
export function useWebSocket() {
  // 存储事件处理器映射，用于取消订阅
  const eventHandlers = new Map();
  
  return {
    /**
     * 连接到WebSocket服务器
     */
    connect() {
      websocketClient.connect();
    },
    
    /**
     * 断开WebSocket连接
     */
    disconnect() {
      websocketClient.disconnect();
    },
    
    /**
     * 订阅事件
     * @param {string} eventName - 事件名称
     * @param {Function} handler - 事件处理函数
     */
    subscribe(eventName, handler) {
      websocketClient.on(eventName, handler);
      
      // 存储处理器以便后续取消订阅
      if (!eventHandlers.has(eventName)) {
        eventHandlers.set(eventName, []);
      }
      eventHandlers.get(eventName).push(handler);
    },
    
    /**
     * 取消订阅事件
     * @param {string} eventName - 事件名称
     * @param {Function} [handler] - 可选的事件处理函数
     */
    unsubscribe(eventName, handler) {
      if (handler) {
        // 取消订阅特定处理器
        websocketClient.off(eventName, handler);
        
        // 从存储中移除
        if (eventHandlers.has(eventName)) {
          const handlers = eventHandlers.get(eventName);
          const index = handlers.indexOf(handler);
          if (index > -1) {
            handlers.splice(index, 1);
          }
        }
      } else {
        // 取消订阅该事件的所有处理器
        if (eventHandlers.has(eventName)) {
          const handlers = eventHandlers.get(eventName);
          handlers.forEach(h => {
            websocketClient.off(eventName, h);
          });
          eventHandlers.delete(eventName);
        }
      }
    },
    
    /**
     * 加入房间
     * @param {string} roomName - 房间名称
     * @returns {boolean} 是否成功
     */
    joinRoom(roomName) {
      return websocketClient.joinRoom(roomName);
    },
    
    /**
     * 离开房间
     * @param {string} roomName - 房间名称
     * @returns {boolean} 是否成功
     */
    leaveRoom(roomName) {
      return websocketClient.leaveRoom(roomName);
    },
    
    /**
     * 订阅执行记录
     * @param {string|number} executionId - 执行记录ID
     * @returns {boolean} 是否成功
     */
    subscribeExecution(executionId) {
      return websocketClient.subscribeExecution(executionId);
    },
    
    /**
     * 取消订阅执行记录
     * @param {string|number} executionId - 执行记录ID
     * @returns {boolean} 是否成功
     */
    unsubscribeExecution(executionId) {
      return websocketClient.unsubscribeExecution(executionId);
    }
  };
}

// 导出单例和类
export { websocketClient, WebSocketClient };

// 默认导出单例
export default websocketClient;