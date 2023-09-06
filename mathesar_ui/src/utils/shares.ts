export const SHARED_LINK_UUID_QUERY_PARAM = 'shared-link-uuid';

interface ShareConfiguration {
  slug: string;
}

export interface ShareConsumerQueryParams extends Record<string, unknown> {
  [SHARED_LINK_UUID_QUERY_PARAM]: ShareConfiguration['slug'];
}

export class ShareConsumer {
  readonly slug: string;

  private queryParams: ShareConsumerQueryParams;

  constructor(props: ShareConfiguration) {
    this.slug = props.slug;
    this.queryParams = {
      [SHARED_LINK_UUID_QUERY_PARAM]: props.slug,
    };
  }

  getQueryParams() {
    return this.queryParams;
  }
}
