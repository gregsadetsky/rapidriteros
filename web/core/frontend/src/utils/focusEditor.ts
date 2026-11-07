import type { MouseEvent } from 'react';

// The code editor's textarea only spans its content, so clicks on the empty
// area of the scrollable box around it land on the box instead. Forward those
// clicks to the textarea so the whole box starts editing.
export const focusEditorOnClick = (e: MouseEvent<HTMLElement>) => {
  if (e.target === e.currentTarget) {
    e.currentTarget.querySelector('textarea')?.focus();
  }
};
