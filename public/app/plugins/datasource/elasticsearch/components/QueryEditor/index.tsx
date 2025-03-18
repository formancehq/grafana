import { useEffect, useState } from 'react';
import { SemVer } from 'semver';

import { getDefaultTimeRange, QueryEditorProps, SelectableValue } from '@grafana/data';
import { EditorHeader, FlexItem } from '@grafana/plugin-ui';
import { Alert, RadioButtonGroup } from '@grafana/ui';

import { ElasticDatasource } from '../../datasource';
import { ElasticsearchOptions, ElasticsearchQuery, ElasticSearchQueryMode } from '../../types';
import { isSupportedVersion, unsupportedVersionMessage } from '../../utils';

import { ElasticsearchProvider } from './ElasticsearchQueryContext';
import { QueryBuilder } from './QueryBuilder/QueryBuilder';
import { RawQueryEditor } from './RawQueryEditor';

export type ElasticQueryEditorProps = QueryEditorProps<ElasticDatasource, ElasticsearchQuery, ElasticsearchOptions>;

// a react hook that returns the elasticsearch database version,
// or `null`, while loading, or if it is not possible to determine the value.
function useElasticVersion(datasource: ElasticDatasource): SemVer | null {
  const [version, setVersion] = useState<SemVer | null>(null);
  useEffect(() => {
    let canceled = false;
    datasource.getDatabaseVersion().then(
      (version) => {
        if (!canceled) {
          setVersion(version);
        }
      },
      (error) => {
        // we do nothing
        console.log(error);
      }
    );

    return () => {
      canceled = true;
    };
  }, [datasource]);

  return version;
}

const queryModeOptions: Array<SelectableValue<ElasticSearchQueryMode>> = [
  { value: ElasticSearchQueryMode.Builder, label: 'Query Builder' },
  { value: ElasticSearchQueryMode.Raw, label: 'Raw Query' },
];
export const QueryEditor = ({ query, onChange, onRunQuery, datasource, range }: ElasticQueryEditorProps) => {
  const elasticVersion = useElasticVersion(datasource);
  const showUnsupportedMessage = elasticVersion != null && !isSupportedVersion(elasticVersion);
  return (
    <ElasticsearchProvider
      datasource={datasource}
      onChange={onChange}
      onRunQuery={onRunQuery}
      query={query}
      range={range || getDefaultTimeRange()}
    >
      {showUnsupportedMessage && <Alert title={unsupportedVersionMessage} />}
      <EditorHeader>
        <FlexItem grow={1} />
        <RadioButtonGroup
          size="sm"
          aria-label="Query mode"
          value={query.queryMode ?? ElasticSearchQueryMode.Builder}
          options={queryModeOptions}
          onChange={(e) => onChange({ ...query, queryMode: e })}
          id={`elastic-query-mode-${query.refId}`}
        />
      </EditorHeader>
      <QueryEditorForm query={query} onChange={onChange} />
    </ElasticsearchProvider>
  );
};

interface Props {
  query: ElasticsearchQuery;
  onChange: (query: ElasticsearchQuery) => void;
}

const QueryEditorForm = ({ query, onChange }: Props) => {
  if (!query.queryMode || query.queryMode === ElasticSearchQueryMode.Builder) {
    return <QueryBuilder query={query} />;
  } else {
    return <RawQueryEditor query={query} onChange={onChange} />;
  }
};
