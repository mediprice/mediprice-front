import admin from './ko/admin.json';
import ai from './ko/ai.json';
import auth from './ko/auth.json';
import claims from './ko/claims.json';
import common from './ko/common.json';
import comparison from './ko/comparison.json';
import errors from './ko/errors.json';
import home from './ko/home.json';
import hospitals from './ko/hospitals.json';
import items from './ko/items.json';
import legal from './ko/legal.json';
import library from './ko/library.json';
import liveFee from './ko/liveFee.json';
import map from './ko/map.json';
import metadata from './ko/metadata.json';
import mypage from './ko/mypage.json';
import nav from './ko/nav.json';
import reviews from './ko/reviews.json';
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
  auth,
  mypage,
  comparison,
  reviews,
  claims,
  library,
  ai,
  map,
  liveFee,
  legal,
  admin,
};
