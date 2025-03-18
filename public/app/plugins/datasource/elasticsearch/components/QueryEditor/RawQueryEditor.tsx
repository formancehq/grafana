import { CodeEditor } from "@grafana/ui"

import { ElasticsearchDataQuery } from "../../dataquery.gen"


interface RawQueryEditorProps {
    query: ElasticsearchDataQuery,
    onChange: (query: ElasticsearchDataQuery) => void
}
export const RawQueryEditor = (props: RawQueryEditorProps) => {
    return (
        // for time series
        // <EditorRows>
        //     <EditorRow>
        //         <EditorField label="Time field" onChange={e => props.onChange({ ...props, rawQuery: e.target.value })}><Input/></EditorField>
        //     </EditorRow>
        // </EditorRows>
        <CodeEditor
            language="json"
            value={props.query.query || ""}
            height="200px"
            showLineNumbers={true}
            showMiniMap={false}
            onBlur={e => props.onChange({ ...props.query, query: e })}
            
        />
    )
}
