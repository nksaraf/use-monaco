import React from 'react';
import {
  MonacoProvider,
  UseMonacoOptions
} from '..';

export function withMonaco(config: UseMonacoOptions, Component: React.FC) {
  return ({ ...props }) => {
    return (
      <MonacoProvider {...config}>
        <Component {...props} />
      </MonacoProvider>
    );
  };
}
