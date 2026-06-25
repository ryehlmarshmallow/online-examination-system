import {
  render,
  screen
} from "@testing-library/react";
import { MarkdownRenderer } from "./markdown-renderer";

describe("MarkdownRenderer", () => {
  it("renders empty string if content is empty", () => {
    const { container } = render(<MarkdownRenderer content="" />);
    expect(container.firstChild).toBeEmptyDOMElement();
  });

  it("renders standard text as is", () => {
    render(<MarkdownRenderer content="This is standard text." />);
    expect(screen.getByText("This is standard text.")).toBeInTheDocument();
  });

  it("renders markdown formatting correctly", () => {
    const { container } = render(<MarkdownRenderer content="This is **bold** and *italic* text." />);
    expect(screen.getByText(/This is/)).toBeInTheDocument();
    expect(container.querySelector("strong")).toHaveTextContent("bold");
    expect(container.querySelector("em")).toHaveTextContent("italic");
  });

  it("renders markdown lists correctly", () => {
    render(
      <MarkdownRenderer
        content={`
- Item 1
- Item 2
`}
      />
    );
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });

  it("renders inline math correctly", () => {
    const { container } = render(<MarkdownRenderer content="Solve $x + y = 3$ please." />);
    expect(screen.getByText(/Solve/)).toBeInTheDocument();
    expect(screen.getByText(/please/)).toBeInTheDocument();

    // Find the math element (katex compiles the formula and keeps the raw tex in the annotation tag)
    const annotation = container.querySelector(".katex annotation");
    expect(annotation).not.toBeNull();
    expect(annotation?.textContent).toBe("x + y = 3");
  });

  it("renders block math correctly", () => {
    const { container } = render(<MarkdownRenderer content="Solve: $$x^2 + y^2 = z^2$$" />);
    expect(screen.getByText(/Solve:/)).toBeInTheDocument();

    // Find the display math block element (.katex-display)
    const displayMath = container.querySelector(".katex-display");
    expect(displayMath).not.toBeNull();

    const annotation = displayMath?.querySelector("annotation");
    expect(annotation).not.toBeNull();
    expect(annotation?.textContent).toBe("x^2 + y^2 = z^2");
  });
});

