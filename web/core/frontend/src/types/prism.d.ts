declare module 'prismjs/components/prism-core' {
  export function highlight(text: string, grammar: any): string;
  export const languages: {
    [key: string]: any;
    js: any;
    javascript: any;
    clike: any;
    markup: any;
    glsl: any;
  };
}

declare module 'prismjs/components/prism-clike';
declare module 'prismjs/components/prism-javascript';
declare module 'prismjs/components/prism-markup';
declare module 'prismjs/components/prism-glsl';
declare module 'prismjs/themes/prism.css';