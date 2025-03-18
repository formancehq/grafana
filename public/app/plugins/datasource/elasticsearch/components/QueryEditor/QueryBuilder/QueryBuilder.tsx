import { css } from "@emotion/css";
import { useId } from "react";

import { GrafanaTheme2 } from "@grafana/data";
import { InlineField, InlineLabel, Input, QueryField, useStyles2 } from "@grafana/ui"
import { useDispatch } from "app/types";

import { useNextId } from "../../../hooks/useNextId";
import { ElasticsearchQuery } from "../../../types";
import { isTimeSeriesQuery } from "../../../utils";
import { changeAliasPattern, changeQuery } from "../state";

import { BucketAggregationsEditor } from "./BucketAggregationsEditor";
import { MetricAggregationsEditor } from "./MetricAggregationsEditor";
import { metricAggregationConfig } from "./MetricAggregationsEditor/utils";
import { QueryTypeSelector } from "./QueryTypeSelector";


interface QueryBuilderProps {
    query: ElasticsearchQuery;
}
export const QueryBuilder = ({query}: QueryBuilderProps) => {
    const isTimeSeries = isTimeSeriesQuery(query);

  const showBucketAggregationsEditor = query.metrics?.every(
    (metric) => metricAggregationConfig[metric.type].impliedQueryType === 'metrics'
  );

      const dispatch = useDispatch();
      const nextId = useNextId();
      const inputId = useId();
      const styles = useStyles2(getStyles);
    return <><div className={styles.root}>
    <InlineLabel width={17}>Query type</InlineLabel>
    <div className={styles.queryItem}>
      <QueryTypeSelector />
    </div>
  </div>
  <div className={styles.root}>
    <InlineLabel width={17}>Lucene Query</InlineLabel>
    <ElasticSearchQueryField onChange={(query) => dispatch(changeQuery(query))} value={query?.query} />

    {isTimeSeries && (
      <InlineField
        label="Alias"
        labelWidth={15}
        tooltip="Aliasing only works for timeseries queries (when the last group is 'Date Histogram'). For all other query types this field is ignored."
        htmlFor={inputId}
      >
        <Input
          id={inputId}
          placeholder="Alias Pattern"
          onBlur={(e) => dispatch(changeAliasPattern(e.currentTarget.value))}
          defaultValue={query.alias}
        />
      </InlineField>
    )}
  </div>


  <MetricAggregationsEditor nextId={nextId} />
  {showBucketAggregationsEditor && <BucketAggregationsEditor nextId={nextId} />}
  </>
}

const getStyles = (theme: GrafanaTheme2) => ({
  root: css({
    display: 'flex',
  }),
  queryItem: css({
    flexGrow: 1,
    margin: theme.spacing(0, 0.5, 0.5, 0),
  }),
});

export const ElasticSearchQueryField = ({ value, onChange }: { value?: string; onChange: (v: string) => void }) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.queryItem}>
      <QueryField query={value} onChange={onChange} placeholder="Enter a lucene query" portalOrigin="elasticsearch" />
    </div>
  );
};
