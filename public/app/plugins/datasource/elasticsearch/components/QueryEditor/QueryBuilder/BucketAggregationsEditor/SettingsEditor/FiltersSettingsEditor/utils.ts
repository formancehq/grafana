import { Filter } from "app/plugins/datasource/elasticsearch/types";

export const defaultFilter = (): Filter => ({ label: '', query: '*' });
