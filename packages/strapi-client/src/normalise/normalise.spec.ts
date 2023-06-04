import { normaliseStrapiResponseArray, normaliseStrapiResponseItem } from '.';
import { StrapiEntity } from '../types';
import fixture from './normalise.fixture.json';

export interface FixtureData extends StrapiEntity {
  title: string;
  formatted_title: string;
  slug: string;
  url: string;
  child_pages?: FixtureData[];
  parent_page?: FixtureData;
}

describe('strapi', () => {
  beforeEach(async () => {});

  it('should normalise a Strapi API single result', async () => {
    const result = normaliseStrapiResponseItem<FixtureData>({
      data: fixture.data[0],
      meta: {},
    });
    expect(result).toBeDefined();
    expect(result.id).toBe(1);
    expect(result.title).toBe('Root');
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('should normalise a Strapi API array result', async () => {
    const result = normaliseStrapiResponseArray<FixtureData>(fixture);
    expect(result).toHaveLength(3);
    const firstItem = result[0];
    expect(firstItem.id).toBe(1);
    expect(firstItem.title).toBe('Root');
    expect(firstItem.child_pages).toHaveLength(1);
    expect(firstItem.child_pages?.[0]?.id).toBe(2);
    expect(firstItem.child_pages?.[0]?.title).toBe('Node');
    expect(firstItem.createdAt).toBeInstanceOf(Date);
  });

  it('should not parse dates if param is set to false', async () => {
    const result = normaliseStrapiResponseItem<FixtureData>(
      {
        data: fixture.data[0],
        meta: {},
      },
      false,
    );
    expect(result).toBeDefined();
    expect(result.createdAt).toBe('2023-04-09T11:26:45.039Z');
  });
});
