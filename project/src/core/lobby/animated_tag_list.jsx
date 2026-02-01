import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import './animated_tag_list.css';

const AnimatedTagItem = ({ children, delay = 0, index, onMouseEnter }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.5, once: false });
  
  return (
    <motion.div
      ref={ref}
      data-index={index}
      onMouseEnter={onMouseEnter}
      initial={{ scale: 0.7, opacity: 0 }}
      animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
      transition={{ duration: 0.2, delay }}
      className="animated-tag-item-wrapper"
    >
      {children}
    </motion.div>
  );
};

const AnimatedTagList = ({
  tags = [],
  selectedTags = [],
  onTagChange,
  showGradients = true,
  enableArrowNavigation = true,
  displayScrollbar = true,
  className = '',
  maxHeight = 400
}) => {
  const listRef = useRef(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [keyboardNav, setKeyboardNav] = useState(false);
  const [topGradientOpacity, setTopGradientOpacity] = useState(0);
  const [bottomGradientOpacity, setBottomGradientOpacity] = useState(1);

  const handleItemMouseEnter = useCallback(index => {
    setFocusedIndex(index);
  }, []);

  const handleTagClick = useCallback(
    (tag, index) => {
      setFocusedIndex(index);
      if (onTagChange) {
        onTagChange(tag);
      }
    },
    [onTagChange]
  );

  const handleScroll = useCallback(e => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    setTopGradientOpacity(Math.min(scrollTop / 50, 1));
    const bottomDistance = scrollHeight - (scrollTop + clientHeight);
    setBottomGradientOpacity(scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1));
  }, []);

  // Check initial scroll state on mount and when tags change
  useEffect(() => {
    if (listRef.current) {
      const { scrollHeight, clientHeight } = listRef.current;
      // If content doesn't overflow, hide bottom gradient
      if (scrollHeight <= clientHeight) {
        setBottomGradientOpacity(0);
      } else {
        setBottomGradientOpacity(1);
      }
    }
  }, [tags]);

  useEffect(() => {
    if (!enableArrowNavigation) return;
    
    const handleKeyDown = e => {
      if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        setFocusedIndex(prev => Math.min(prev + 1, tags.length - 1));
      } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        setFocusedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (focusedIndex >= 0 && focusedIndex < tags.length) {
          e.preventDefault();
          if (onTagChange) {
            onTagChange(tags[focusedIndex]);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tags, focusedIndex, onTagChange, enableArrowNavigation]);

  useEffect(() => {
    if (!keyboardNav || focusedIndex < 0 || !listRef.current) return;
    
    const container = listRef.current;
    const focusedItem = container.querySelector(`[data-index="${focusedIndex}"]`);
    
    if (focusedItem) {
      const extraMargin = 50;
      const containerScrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const itemTop = focusedItem.offsetTop;
      const itemBottom = itemTop + focusedItem.offsetHeight;
      
      if (itemTop < containerScrollTop + extraMargin) {
        container.scrollTo({ top: itemTop - extraMargin, behavior: 'smooth' });
      } else if (itemBottom > containerScrollTop + containerHeight - extraMargin) {
        container.scrollTo({
          top: itemBottom - containerHeight + extraMargin,
          behavior: 'smooth'
        });
      }
    }
    setKeyboardNav(false);
  }, [focusedIndex, keyboardNav]);

  return (
    <div className={`animated-tag-list-container ${className}`}>
      <div 
        ref={listRef} 
        className={`animated-tag-list ${!displayScrollbar ? 'no-scrollbar' : ''}`} 
        onScroll={handleScroll}
        style={{ maxHeight: `${maxHeight}px` }}
      >
        {tags.map((tag, index) => (
          <AnimatedTagItem
            key={`tag-${tag}`}
            delay={0.05}
            index={index}
            onMouseEnter={() => handleItemMouseEnter(index)}
          >
            <label 
              className={`animated-tag-label ${focusedIndex === index ? 'focused' : ''} ${selectedTags.includes(tag) ? 'selected' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                handleTagClick(tag, index);
              }}
            >
              <input
                type="checkbox"
                checked={selectedTags.includes(tag)}
                onChange={() => {}} // Handled by label click
                tabIndex={-1}
              />
              <span className="tag-text">{tag}</span>
            </label>
          </AnimatedTagItem>
        ))}
      </div>
      {showGradients && (
        <>
          <div className="animated-tag-top-gradient" style={{ opacity: topGradientOpacity }}></div>
          <div className="animated-tag-bottom-gradient" style={{ opacity: bottomGradientOpacity }}></div>
        </>
      )}
    </div>
  );
};

export default AnimatedTagList;
