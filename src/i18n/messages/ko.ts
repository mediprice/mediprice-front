import common from './ko/common.json';
import errors from './ko/errors.json';
import home from './ko/home.json';
import hospitals from './ko/hospitals.json';
import items from './ko/items.json';
import metadata from './ko/metadata.json';
import nav from './ko/nav.json';
import search from './ko/search.json';
import validation from './ko/validation.json';

/** 네임스페이스마다 파일을 나눠 여러 화면을 동시에 작업해도 충돌하지 않게 한다. 새 파일은 여기에 추가한다. */
export const messages = {
  metadata,
  common,
  nav,
  errors,
  validation,
  home,
  search,
  items,
  hospitals,
};
