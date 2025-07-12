import React from 'react';
import { Card, LoadingIndicator } from '../atoms';
import { EmptyState } from '../molecules';
import type { IconName } from '../atoms';

export interface ResourceListProps<T> {
  items: T[] | null;
  isError?: boolean;
  isLoading: boolean;
  emptyState: {
    iconName: IconName;
    title: string;
    description: string;
    action?: React.ReactNode;
  };
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
  className?: string;
}

function ResourceList<T>({ 
  items, 
  isError,
  isLoading, 
  emptyState, 
  renderItem, 
  keyExtractor,
  className = ""
}: ResourceListProps<T>) {
  if (isError) {
    return <></>;
  }
  if (isLoading) {
    return <LoadingIndicator />;
  }

  if (!items || items.length === 0) {
    return (
      <Card>
        <EmptyState
          iconName={emptyState.iconName}
          title={emptyState.title}
          description={emptyState.description}
          action={emptyState.action}
        />
      </Card>
    );
  }

  return (
    <Card className={className}>
      <ul className="divide-y divide-gray-200">
        {items.map(item => (
          <React.Fragment key={keyExtractor(item)}>
            {renderItem(item)}
          </React.Fragment>
        ))}
      </ul>
    </Card>
  );
}

export default ResourceList;
