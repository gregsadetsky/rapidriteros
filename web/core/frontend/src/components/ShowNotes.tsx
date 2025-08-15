import React from 'react';

interface ShowNotesProps {
  showType: string;
}

export const ShowNotes: React.FC<ShowNotesProps> = ({ showType }) => {
  const getShowTypeNotes = (showType: string) => {
    switch (showType) {
      case 'p5':
        return {
          title: "P5 Show Notes",
          content: (
            <pre className="text-sm text-gray-600 bg-gray-50 p-3 rounded border whitespace-pre-wrap">
{`A FEW IMPORTANT HINTS:
- don't call createCanvas() or size() functions
- have a setup() and a main draw() function
- do not call console.log!!
- it's better to draw black pixels on a white background
  - i.e. call background(0) and then fill(255)
- i love u`}
            </pre>
          )
        };
      case 'text':
        return {
          title: "Text Show Notes",
          content: (
            <div>
              <pre className="text-sm text-gray-600 bg-gray-50 p-3 rounded border whitespace-pre-wrap">
{`AVAILABLE GLYPHS:
 !"#$%&'()*+,-./
 0123456789:;<=>?
 @ABCDEFGHIJKLMNO
 PQRSTUVWXYZ[\\]^_
 \`abcdefghijklmno
 pqrstuvwxyz{|}~∎`}
              </pre>
              <p className="text-sm text-gray-600 mt-2">
                feel free to{' '}
                <a 
                  href="https://recurse.zulipchat.com/#narrow/dm/7864"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  ping @jessechen
                </a>
                {' '}or{' '}
                <a 
                  href="https://github.com/jessechen/bubbletea"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  make a pull request
                </a>
                {' '}to add more!!
              </p>
            </div>
          )
        };
      case 'wasm':
        return {
          title: "WASM Show Notes",
          content: (
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
              <p className="mb-2">HOW TO WASM:</p>
              <p className="mb-1">
                - Paste your{' '}
                <a 
                  href="https://developer.mozilla.org/en-US/docs/WebAssembly/Understanding_the_text_format"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  WebAssembly Text (WAT)
                </a>
                {' '}file here
              </p>
              <pre className="whitespace-pre-wrap mb-2">
{`- implement a next_frame function with the signature: next_frame(frame: u16, ptr: *mut u8) -> u8
    - first input is the current (zero-indexed) frame
    - second input is a pointer to the 456-byte array
    - return value is zero if you have more frames to render, one if you're done rendering things
      - But you only get 100 frames, don't be greedy!`}
              </pre>
              <p>
                - See{' '}
                <a 
                  href="https://git.sr.ht/~bsprague/recurse/tree/main/item/rapidriter/simpletest"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  an example implementation in Rust
                </a>
              </p>
            </div>
          )
        };
      case 'shader':
        return {
          title: "Shader Show Notes",
          content: (
            <pre className="text-sm text-gray-600 bg-gray-50 p-3 rounded border whitespace-pre-wrap">
              Write your shader code here. Use GLSL syntax.
            </pre>
          )
        };
      default:
        return { 
          title: "Show Notes", 
          content: <div></div>
        };
    }
  };

  const notes = getShowTypeNotes(showType);

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{notes.title}</h3>
      {notes.content}
    </div>
  );
};