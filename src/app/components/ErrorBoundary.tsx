/**
 * React Error Boundary 组件
 * 捕获子组件中的React错误,防止整个应用崩溃
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // 更新state使下一次渲染能够显示降级后的UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 可以将错误日志上报给服务器
    console.error('Error Boundary caught an error:', error);
    console.error('Component stack:', errorInfo.componentStack);

    // 记录错误到window对象,方便测试访问
    if (typeof window !== 'undefined') {
      const errorList = (window as any).__reactErrors || [];
      errorList.push({
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        errorInfo: {
          componentStack: errorInfo.componentStack,
        },
        timestamp: Date.now(),
      });
      (window as any).__reactErrors = errorList;
    }

    // 调用自定义错误处理函数
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 更新state
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义降级UI,使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误UI
      return (
        <div style={styles.errorContainer}>
          <div style={styles.errorBox}>
            <h2 style={styles.heading}>⚠️ 出错了</h2>
            <p style={styles.message}>
              应用程序遇到了一个错误。请刷新页面重试,如果问题持续存在,请联系技术支持。
            </p>
            {this.state.error && (
              <details style={styles.details}>
                <summary style={styles.summary}>错误详情 (开发者用)</summary>
                <div style={styles.errorDetails}>
                  <strong>错误:</strong>
                  <pre style={styles.pre}>
                    {this.state.error.name}: {this.state.error.message}
                  </pre>
                  {this.state.error.stack && (
                    <>
                      <strong>堆栈:</strong>
                      <pre style={styles.pre}>
                        {this.state.error.stack}
                      </pre>
                    </>
                  )}
                  {this.state.errorInfo && this.state.errorInfo.componentStack && (
                    <>
                      <strong>组件堆栈:</strong>
                      <pre style={styles.pre}>
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}
            <button
              style={styles.button}
              onClick={() => window.location.reload()}
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 简单的内联样式
const styles = {
  errorContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    padding: '20px',
  } as React.CSSProperties,
  errorBox: {
    maxWidth: '600px',
    width: '100%',
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '32px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  } as React.CSSProperties,
  heading: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#dc2626',
    marginTop: 0,
    marginBottom: '16px',
  } as React.CSSProperties,
  message: {
    fontSize: '16px',
    color: '#4b5563',
    lineHeight: '1.5',
    marginBottom: '24px',
  } as React.CSSProperties,
  details: {
    marginTop: '16px',
    marginBottom: '24px',
  } as React.CSSProperties,
  summary: {
    cursor: 'pointer',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '12px',
  } as React.CSSProperties,
  errorDetails: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    padding: '12px',
    marginTop: '8px',
  } as React.CSSProperties,
  pre: {
    backgroundColor: '#1f2937',
    color: '#f9fafb',
    padding: '12px',
    borderRadius: '4px',
    overflow: 'auto',
    fontSize: '12px',
    lineHeight: '1.4',
    marginTop: '8px',
    marginBottom: '8px',
  } as React.CSSProperties,
  button: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  } as React.CSSProperties,
};

export default ErrorBoundary;
