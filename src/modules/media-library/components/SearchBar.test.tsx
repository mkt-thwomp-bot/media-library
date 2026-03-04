/**
 * SearchBar 组件测试
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchBar } from './SearchBar';
import { useMediaLibraryStore } from '../store';

// Mock the store
jest.mock('../store', () => ({
  useMediaLibraryStore: jest.fn(),
}));

describe('SearchBar', () => {
  const mockSetSearchQuery = jest.fn();
  const mockOnSearch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    (useMediaLibraryStore as jest.Mock).mockReturnValue({
      filters: { search: '' },
      setSearchQuery: mockSetSearchQuery,
      isLoading: false,
      total: 100,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders with default placeholder', () => {
    render(<SearchBar />);
    expect(screen.getByPlaceholderText('搜索素材...')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(<SearchBar placeholder="搜索图片..." />);
    expect(screen.getByPlaceholderText('搜索图片...')).toBeInTheDocument();
  });

  it('calls onSearch callback when typing', async () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });
    
    // Wait for debounce
    jest.advanceTimersByTime(150);
    
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('test');
    });
  });

  it('calls setSearchQuery when typing', async () => {
    render(<SearchBar />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'query' } });
    
    // Wait for debounce
    jest.advanceTimersByTime(150);
    
    await waitFor(() => {
      expect(mockSetSearchQuery).toHaveBeenCalledWith('query');
    });
  });

  it('triggers search immediately on Enter key', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'immediate' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    // Should not wait for debounce
    expect(mockOnSearch).toHaveBeenCalledWith('immediate');
    expect(mockSetSearchQuery).toHaveBeenCalledWith('immediate');
  });

  it('clears search on Escape key', () => {
    render(<SearchBar />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'to clear' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    
    expect(mockSetSearchQuery).toHaveBeenCalledWith('');
  });

  it('shows clear button when input has value', () => {
    (useMediaLibraryStore as jest.Mock).mockReturnValue({
      filters: { search: 'has value' },
      setSearchQuery: mockSetSearchQuery,
      isLoading: false,
      total: 100,
    });
    
    render(<SearchBar />);
    
    expect(screen.getByLabelText('清除搜索')).toBeInTheDocument();
  });

  it('hides clear button when input is empty', () => {
    render(<SearchBar />);
    
    expect(screen.queryByLabelText('清除搜索')).not.toBeInTheDocument();
  });

  it('clears search when clear button is clicked', () => {
    (useMediaLibraryStore as jest.Mock).mockReturnValue({
      filters: { search: 'to clear' },
      setSearchQuery: mockSetSearchQuery,
      isLoading: false,
      total: 100,
    });
    
    render(<SearchBar />);
    
    const clearButton = screen.getByLabelText('清除搜索');
    fireEvent.click(clearButton);
    
    expect(mockSetSearchQuery).toHaveBeenCalledWith('');
  });

  it('displays total count when not searching', () => {
    render(<SearchBar />);
    
    expect(screen.getByText('共 100 个素材')).toBeInTheDocument();
  });

  it('displays result count when searching', () => {
    (useMediaLibraryStore as jest.Mock).mockReturnValue({
      filters: { search: 'query' },
      setSearchQuery: mockSetSearchQuery,
      isLoading: false,
      total: 50,
    });
    
    render(<SearchBar />);
    
    expect(screen.getByText('找到 50 个结果')).toBeInTheDocument();
  });

  it('shows loading indicator when searching', () => {
    (useMediaLibraryStore as jest.Mock).mockReturnValue({
      filters: { search: 'query' },
      setSearchQuery: mockSetSearchQuery,
      isLoading: true,
      total: 50,
    });
    
    render(<SearchBar />);
    
    // Trigger a search to show loading
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new query' } });
    jest.advanceTimersByTime(100);
    
    // Should show loading spinner
    expect(screen.getByRole('textbox').parentElement?.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
