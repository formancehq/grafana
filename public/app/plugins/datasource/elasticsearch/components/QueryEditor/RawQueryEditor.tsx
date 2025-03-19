import { EditorField, EditorRow, EditorRows } from '@grafana/plugin-ui';
import { CodeEditor, Combobox, Input } from '@grafana/ui';

import { ElasticsearchDataQuery } from '../../dataquery.gen';

interface RawQueryEditorProps {
  query: ElasticsearchDataQuery;
  onChange: (query: ElasticsearchDataQuery) => void;
}
export const RawQueryEditor = (props: RawQueryEditorProps) => {
  return (
    <>
      {/* for time series */}
      <EditorRows>
        <EditorRow>
          {/* define query response processing */}
          <EditorField label="Process query as" tooltip="Define how the query response should be processed.">
            <Combobox
              options={[
                { label: 'Time series', value: 'time_series' },
                { label: 'Logs', value: 'logs' },
                { label: 'Table', value: 'table' },
              ]}
              onChange={(e) =>
                props.onChange({
                  ...props.query,
                  rawQuerySettings: { ...props.query.rawQuerySettings, processAs: e.value },
                })
              }
              value={props.query.rawQuerySettings?.processAs}
            />
          </EditorField>
          {props.query.rawQuerySettings?.processAs === 'time_series' && (
            <EditorRow>
              <EditorField label="Time field">
                <Input
                  onChange={(e) =>
                    props.onChange({
                      ...props.query,
                      rawQuerySettings: { ...props.query.rawQuerySettings, timeField: e.currentTarget.value },
                    })
                  }
                />
              </EditorField>
              <EditorField label="Value field" description="aggregation ID to use as value field. In case of multiple, separate aggregation IDs with a comma">
                <Input
                  onChange={(e) =>
                    props.onChange({
                      ...props.query,
                      rawQuerySettings: { ...props.query.rawQuerySettings, valueField: e.currentTarget.value },
                    })
                  }
                />
              </EditorField>
            </EditorRow>
          )}
        </EditorRow>
      </EditorRows>
      <CodeEditor
        language="json"
        value={props.query.query || ''}
        height="200px"
        showLineNumbers={true}
        showMiniMap={false}
        onBlur={(e) => props.onChange({ ...props.query, query: e })}
      />
    </>
  );
};
