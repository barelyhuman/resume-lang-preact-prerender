import resume from "../resume/base.resume";
import { h } from "preact";

export default function Resume() {
  return (
    <>
      {resume.children.map((d) => (
        <NodeRenderer node={d} depth={1} />
      ))}
    </>
  );
}

function NodeRenderer({ node, depth }) {
  switch (node.type) {
    case "group": {
      return (
        <div data-resume-type="group">
          {node.children.map((d) => (
            <NodeRenderer node={d} depth={depth} />
          ))}
        </div>
      );
    }
    case "section": {
      return (
        <section data-resume-id={node.value}>
          {node.value ? h(`h${depth}`, {}, node.value) : null}
          {node.children.map((d) => (
            <NodeRenderer node={d} depth={depth + 1} />
          ))}
        </section>
      );
    }
    case "label": {
      return (
        <div data-resume-id={node.value.id}>
          <RenderNodeModifier node={node.value} />
        </div>
      );
    }
    case "rich-text": {
      return (
        <div data-resume-type="rich-text" data-resume-id={node.value.id}>
          <article
            class="prose prose-zinc"
            dangerouslySetInnerHTML={{ __html: node.value.transformed }}
          />
        </div>
      );
    }
    default: {
      return <></>;
    }
  }
}

function RenderNodeModifier({ node }) {
  const valueRef = node.value;
  switch (valueRef.type) {
    case "text": {
      return <p>{valueRef.value}</p>;
    }
    case "url": {
      return <a href={valueRef.value.link}>{valueRef.value.alias}</a>;
    }
  }
  return <></>;
}
