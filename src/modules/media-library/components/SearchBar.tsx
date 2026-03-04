/**
 * SearchBar - 媒体库搜索栏组件
 * 
 * 功能特性：
 * - 搜索输入框（带清除按钮）
 * - 150ms debounce 防抖
 * - 加载状态指示
 * - 搜索结果计数显示
 * - 键盘操作支持（Enter 触发、Esc 清除）
 * - 即时搜索（输入即搜）
 * - 空搜索显示全部
 * 
 * 主题集成：
 * - 使用语义 Token 适配所有 Skin（Glass/Native/shadcn/Modern）
 * - 遵循项目设计系统
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useMediaLibraryStore } from '../store';

export interface SearchBarProps {
  /** 输入框占位符文本 */
  placeholder?: string;
  /** 搜索回调（可选，用于外部监听） */
  onSearch?: (query: string) => void;
  /** 自定义类名 */
  className?: string;
}

/** 防抖延迟时间（毫秒） */
const DEBOUNCE_DELAY = 150;

/** 加载指示延迟时间（毫秒）- 超过此时间才显示加载状态 */
const LOADING_INDICATOR_DELAY = 100;

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = '搜索素材...',
  onSearch,
  className = '',
}) => {
  // 从 store 获取状态和操作
  const { filters, setSearchQuery, isLoading, total } = useMediaLibraryStore();
  
  // 本地输入状态（用于即时响应输入）
  const [inputValue, setInputValue] = useState(filters.search);
  
  // 加载指示器显示状态
  const [showLoading, setShowLoading] = useState(false);
  
  // 用于防抖的 ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 同步外部筛选状态到本地输入
  useEffect(() => {
    setInputValue(filters.search);
  }, [filters.search]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, []);

  // 处理搜索逻辑
  const performSearch = useCallback((query: string) => {
    // 清除之前的加载定时器
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
    }
    
    // 如果搜索延迟超过阈值，显示加载指示
    loadingTimerRef.current = setTimeout(() => {
      setShowLoading(true);
    }, LOADING_INDICATOR_DELAY);

    // 执行搜索
    setSearchQuery(query);
    
    // 调用外部回调
    onSearch?.(query);
    
    // 搜索完成后隐藏加载指示
    const hideLoading = () => setShowLoading(false);
    
    // 使用 Promise 检查加载状态
    const checkLoading = () => {
      const store = useMediaLibraryStore.getState();
      if (!store.isLoading) {
        hideLoading();
      } else {
        setTimeout(checkLoading, 50);
      }
    };
    
    // 延迟检查以确保状态已更新
    setTimeout(checkLoading, LOADING_INDICATOR_DELAY + 50);
  }, [setSearchQuery, onSearch]);

  // 处理输入变化（带防抖）
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // 清除之前的防抖定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // 设置新的防抖定时器
    debounceTimerRef.current = setTimeout(() => {
      performSearch(value);
    }, DEBOUNCE_DELAY);
  }, [performSearch]);

  // 清除搜索
  const handleClear = useCallback(() => {
    setInputValue('');
    
    // 清除防抖定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // 立即执行空搜索（显示全部）
    performSearch('');
    
    // 聚焦输入框
    inputRef.current?.focus();
  }, [performSearch]);

  // 处理 Enter 键（立即搜索，不防抖）
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // 清除防抖定时器，立即执行
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      performSearch(inputValue);
    } else if (e.key === 'Escape') {
      // Esc 键清除搜索
      handleClear();
    }
  }, [inputValue, performSearch, handleClear]);

  // 是否显示清除按钮
  const showClearButton = inputValue.length > 0;
  
  // 是否显示加载指示器
  const isSearching = isLoading && showLoading;
  
  // 搜索结果计数文本
  const resultCountText = filters.search 
    ? `找到 ${total} 个结果`
    : `共 ${total} 个素材`;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* 搜索输入框容器 */}
      <div className="relative flex-1 min-w-0">
        {/* 搜索图标 */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {isSearching ? (
            <Loader2 
              className="w-4 h-4 text-[var(--s-accent)] animate-spin" 
              aria-hidden="true"
            />
          ) : (
            <Search 
              className="w-4 h-4 text-[var(--s-text-muted)]" 
              aria-hidden="true"
            />
          )}
        </div>
        
        {/* 输入框 */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="搜索素材"
          aria-describedby="search-results-count"
          className="
            w-full h-10 pl-10 pr-10
            bg-[var(--s-bg-input)]
            border border-[var(--s-border)]
            rounded-lg
            text-sm text-[var(--s-text-primary)]
            placeholder:text-[var(--s-text-muted)]
            focus:outline-none focus:border-[var(--s-accent)] focus:ring-2 focus:ring-[var(--s-accent)]/20
            transition-all duration-200
          "
        />
        
        {/* 清除按钮 */}
        {showClearButton && (
          <button
            type="button"
            onClick={handleClear}
            className="
              absolute right-3 top-1/2 -translate-y-1/2
              w-5 h-5
              flex items-center justify-center
              rounded-full
              text-[var(--s-text-muted)]
              hover:text-[var(--s-text-primary)]
              hover:bg-[var(--s-bg-hover)]
              transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-[var(--s-accent)]/20
            "
            aria-label="清除搜索"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      
      {/* 搜索结果计数 */}
      <span 
        id="search-results-count"
        className="
          text-xs text-[var(--s-text-secondary)]
          whitespace-nowrap
          hidden sm:inline-block
        "
      >
        {resultCountText}
      </span>
    </div>
  );
};

export default SearchBar;
