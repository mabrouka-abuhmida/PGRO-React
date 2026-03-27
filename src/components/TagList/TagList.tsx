/**
 * TagList component - displays a list of tags/keywords
 */
import React from 'react';
import './TagList.css';

interface TagListProps {
  tags: string[];
  maxTags?: number;
  className?: string;
  onTagClick?: (tag: string) => void;
}

export const TagList: React.FC<TagListProps> = ({
  tags,
  maxTags,
  className = '',
  onTagClick,
}) => {
  const displayTags = maxTags ? tags.slice(0, maxTags) : tags;
  const remainingCount = maxTags && tags.length > maxTags ? tags.length - maxTags : 0;

  return (
    <div className={`tag-list ${className}`}>
      {displayTags.map((tag, index) => (
        <span
          key={index}
          className={`tag ${onTagClick ? 'tag-clickable' : ''}`}
          onClick={() => onTagClick?.(tag)}
        >
          {tag}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className="tag tag-more">+{remainingCount} more</span>
      )}
    </div>
  );
};

