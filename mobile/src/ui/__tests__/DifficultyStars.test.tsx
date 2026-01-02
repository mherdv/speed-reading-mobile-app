import React from 'react';
import { render } from '@testing-library/react-native';
import { DifficultyStars } from '../DifficultyStars';

describe('DifficultyStars', () => {
  it('shows 0 filled dots for level 1', () => {
    const { UNSAFE_getAllByType } = render(<DifficultyStars level={1} />);
    const { View } = require('react-native');
    
    // Get all View elements (dots are rendered as Views)
    const allViews = UNSAFE_getAllByType(View);
    // Filter to find dots by checking for backgroundColor style
    const dots = allViews.filter((view: any) => {
      const style = view.props.style;
      if (Array.isArray(style)) {
        return style.some((s: any) => s?.backgroundColor === '#6366F1' || s?.backgroundColor === '#E5E7EB');
      }
      return style?.backgroundColor === '#6366F1' || style?.backgroundColor === '#E5E7EB';
    });
    
    expect(dots.length).toBe(5);
    
    // All should be empty (gray) for level 1
    const filledDots = dots.filter((dot: any) => {
      const style = dot.props.style;
      if (Array.isArray(style)) {
        return style.some((s: any) => s?.backgroundColor === '#6366F1');
      }
      return style?.backgroundColor === '#6366F1';
    });
    expect(filledDots.length).toBe(0);
  });

  it('shows 1 filled dot for level 2-4', () => {
    const { UNSAFE_getAllByType } = render(<DifficultyStars level={3} />);
    const { View } = require('react-native');
    
    const allViews = UNSAFE_getAllByType(View);
    const filledDots = allViews.filter((view: any) => {
      const style = view.props.style;
      if (Array.isArray(style)) {
        return style.some((s: any) => s?.backgroundColor === '#6366F1');
      }
      return style?.backgroundColor === '#6366F1';
    });
    
    expect(filledDots.length).toBe(1);
  });

  it('shows 2 filled dots for level 5-7', () => {
    const { UNSAFE_getAllByType } = render(<DifficultyStars level={6} />);
    const { View } = require('react-native');
    
    const allViews = UNSAFE_getAllByType(View);
    const filledDots = allViews.filter((view: any) => {
      const style = view.props.style;
      if (Array.isArray(style)) {
        return style.some((s: any) => s?.backgroundColor === '#6366F1');
      }
      return style?.backgroundColor === '#6366F1';
    });
    
    expect(filledDots.length).toBe(2);
  });

  it('shows 3 filled dots for level 8-10', () => {
    const { UNSAFE_getAllByType } = render(<DifficultyStars level={9} />);
    const { View } = require('react-native');
    
    const allViews = UNSAFE_getAllByType(View);
    const filledDots = allViews.filter((view: any) => {
      const style = view.props.style;
      if (Array.isArray(style)) {
        return style.some((s: any) => s?.backgroundColor === '#6366F1');
      }
      return style?.backgroundColor === '#6366F1';
    });
    
    expect(filledDots.length).toBe(3);
  });

  it('shows 4 filled dots for level 11-13', () => {
    const { UNSAFE_getAllByType } = render(<DifficultyStars level={12} />);
    const { View } = require('react-native');
    
    const allViews = UNSAFE_getAllByType(View);
    const filledDots = allViews.filter((view: any) => {
      const style = view.props.style;
      if (Array.isArray(style)) {
        return style.some((s: any) => s?.backgroundColor === '#6366F1');
      }
      return style?.backgroundColor === '#6366F1';
    });
    
    expect(filledDots.length).toBe(4);
  });

  it('shows 5 filled dots for level 14-15', () => {
    const { UNSAFE_getAllByType } = render(<DifficultyStars level={15} />);
    const { View } = require('react-native');
    
    const allViews = UNSAFE_getAllByType(View);
    const filledDots = allViews.filter((view: any) => {
      const style = view.props.style;
      if (Array.isArray(style)) {
        return style.some((s: any) => s?.backgroundColor === '#6366F1');
      }
      return style?.backgroundColor === '#6366F1';
    });
    
    expect(filledDots.length).toBe(5);
  });

  it('shows level text when showLevel is true', () => {
    const { getByText } = render(<DifficultyStars level={5} showLevel={true} />);
    
    expect(getByText('Lv.5')).toBeTruthy();
  });

  it('renders different sizes', () => {
    const { UNSAFE_getAllByType: getSmall } = render(<DifficultyStars level={3} size="small" />);
    const { UNSAFE_getAllByType: getLarge } = render(<DifficultyStars level={3} size="large" />);
    const { View } = require('react-native');
    
    // Find dots with size styles
    const smallDots = getSmall(View).filter((view: any) => {
      const style = view.props.style;
      if (Array.isArray(style)) {
        return style.some((s: any) => s?.width === 6);
      }
      return style?.width === 6;
    });
    
    const largeDots = getLarge(View).filter((view: any) => {
      const style = view.props.style;
      if (Array.isArray(style)) {
        return style.some((s: any) => s?.width === 10);
      }
      return style?.width === 10;
    });
    
    expect(smallDots.length).toBeGreaterThan(0);
    expect(largeDots.length).toBeGreaterThan(0);
  });
});
