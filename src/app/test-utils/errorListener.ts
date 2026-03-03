/**
 * 全局错误监听器
 * 用于在测试中捕获前端运行时错误
 */

export interface ConsoleError {
  type: "error" | "warning" | "log";
  message: string;
  stack?: string;
  timestamp: number;
  location?: {
    url?: string;
    line?: number;
    column?: number;
  };
}

export interface UnhandledError {
  type: "unhandledrejection" | "error";
  message: string;
  reason?: any;
  timestamp: number;
}

class ErrorListener {
  private consoleErrors: ConsoleError[] = [];
  private unhandledErrors: UnhandledError[] = [];
  private originalConsoleError!: typeof console.error;
  private originalConsoleWarn!: typeof console.warn;
  private originalConsoleLog!: typeof console.log;
  private listenersAttached = false;

  /**
   * 启动错误监听
   */
  start() {
    if (this.listenersAttached) {
      return;
    }

    // 保存原始console方法
    this.originalConsoleError = console.error;
    this.originalConsoleWarn = console.warn;
    this.originalConsoleLog = console.log;

    // 重写console方法以捕获输出
    console.error = (...args: any[]) => {
      this.consoleErrors.push({
        type: "error",
        message: this.formatMessage(args),
        timestamp: Date.now(),
      });
      this.originalConsoleError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      this.consoleErrors.push({
        type: "warning",
        message: this.formatMessage(args),
        timestamp: Date.now(),
      });
      this.originalConsoleWarn.apply(console, args);
    };

    console.log = (...args: any[]) => {
      // 可选: 也可以捕获log
      // this.consoleErrors.push({
      //   type: 'log',
      //   message: this.formatMessage(args),
      //   timestamp: Date.now(),
      // });
      this.originalConsoleLog.apply(console, args);
    };

    // 监听未处理的Promise rejection
    window.addEventListener(
      "unhandledrejection",
      this.handleUnhandledRejection,
    );

    // 监听全局错误
    window.addEventListener("error", this.handleGlobalError);

    this.listenersAttached = true;
  }

  /**
   * 停止错误监听
   */
  stop() {
    if (!this.listenersAttached) {
      return;
    }

    // 恢复原始console方法
    console.error = this.originalConsoleError;
    console.warn = this.originalConsoleWarn;
    console.log = this.originalConsoleLog;

    // 移除事件监听
    window.removeEventListener(
      "unhandledrejection",
      this.handleUnhandledRejection,
    );
    window.removeEventListener("error", this.handleGlobalError);

    this.listenersAttached = false;
  }

  /**
   * 清空错误记录
   */
  clear() {
    this.consoleErrors = [];
    this.unhandledErrors = [];
  }

  /**
   * 获取所有console错误
   */
  getConsoleErrors(): ConsoleError[] {
    return [...this.consoleErrors];
  }

  /**
   * 获取所有未处理错误
   */
  getUnhandledErrors(): UnhandledError[] {
    return [...this.unhandledErrors];
  }

  /**
   * 获取所有错误(console + 未处理)
   */
  getAllErrors(): Array<ConsoleError | UnhandledError> {
    return [...this.consoleErrors, ...this.unhandledErrors];
  }

  /**
   * 检查是否有错误
   */
  hasErrors(): boolean {
    return this.consoleErrors.length > 0 || this.unhandledErrors.length > 0;
  }

  /**
   * 获取错误摘要
   */
  getSummary(): {
    consoleErrors: number;
    consoleWarnings: number;
    unhandledRejections: number;
    globalErrors: number;
  } {
    return {
      consoleErrors: this.consoleErrors.filter((e) => e.type === "error")
        .length,
      consoleWarnings: this.consoleErrors.filter((e) => e.type === "warning")
        .length,
      unhandledRejections: this.unhandledErrors.filter(
        (e) => e.type === "unhandledrejection",
      ).length,
      globalErrors: this.unhandledErrors.filter((e) => e.type === "error")
        .length,
    };
  }

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    this.unhandledErrors.push({
      type: "unhandledrejection",
      message: event.reason?.message || String(event.reason),
      reason: event.reason,
      timestamp: Date.now(),
    });
  };

  private handleGlobalError = (event: ErrorEvent) => {
    this.unhandledErrors.push({
      type: "error",
      message: event.message,
      reason: event.error,
      timestamp: Date.now(),
    });
  };

  private formatMessage(args: any[]): string {
    return args
      .map((arg) => {
        if (typeof arg === "string") {
          return arg;
        }
        if (arg instanceof Error) {
          return `${arg.name}: ${arg.message}`;
        }
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      })
      .join(" ");
  }
}

// 创建全局单例
const errorListener = new ErrorListener();

// 在window对象上暴露,方便测试访问
if (typeof window !== "undefined") {
  (window as any).__errorListener = errorListener;
}

export default errorListener;
