/** 네이버 지도 JavaScript API v3에서 쓰는 부분만 옮긴 타입. 타입 패키지를 들이지 않으려고 직접 둔다. */
type NaverLatLng = { lat(): number; lng(): number };
type NaverLatLngBounds = { hasLatLng(latlng: NaverLatLng): boolean };
type NaverPoint = { x: number; y: number };
type NaverSize = { width: number; height: number };
export type NaverListener = { readonly __brand?: 'NaverListener' };

export type NaverMap = {
  getCenter(): NaverLatLng;
  setCenter(center: NaverLatLng): void;
  panTo(center: NaverLatLng, transition?: { duration?: number }): void;
  getZoom(): number;
  setZoom(zoom: number, effect?: boolean): void;
  fitBounds(bounds: NaverLatLngBounds): void;
  getSize(): NaverSize;
  setSize(size: NaverSize): void;
  getProjection(): { fromCoordToOffset(latlng: NaverLatLng): NaverPoint };
  destroy(): void;
};

type NaverHtmlIcon = { content: HTMLElement; anchor: NaverPoint };

export type NaverMarker = {
  setIcon(icon: NaverHtmlIcon): void;
  setZIndex(zIndex: number): void;
  setPosition(position: NaverLatLng): void;
  setMap(map: NaverMap | null): void;
};

export type NaverCircle = {
  setCenter(center: NaverLatLng): void;
  setRadius(radius: number): void;
  setMap(map: NaverMap | null): void;
};

type NaverMapOptions = {
  center: NaverLatLng;
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
  maxBounds?: NaverLatLngBounds;
  zoomControl?: boolean;
  mapTypeControl?: boolean;
  scaleControl?: boolean;
  logoControl?: boolean;
  logoControlOptions?: { position: number };
  mapDataControl?: boolean;
  mapDataControlOptions?: { position: number };
};

export type NaverMapsApi = {
  Map: new (element: HTMLElement, options: NaverMapOptions) => NaverMap;
  LatLng: new (lat: number, lng: number) => NaverLatLng;
  LatLngBounds: new (sw: NaverLatLng, ne: NaverLatLng) => NaverLatLngBounds;
  Point: new (x: number, y: number) => NaverPoint;
  Size: new (width: number, height: number) => NaverSize;
  Marker: new (options: {
    map: NaverMap;
    position: NaverLatLng;
    icon: NaverHtmlIcon;
    zIndex?: number;
    clickable?: boolean;
  }) => NaverMarker;
  Circle: new (options: {
    map: NaverMap;
    center: NaverLatLng;
    radius: number;
    strokeColor: string;
    strokeOpacity: number;
    strokeWeight: number;
    strokeStyle: string;
    fillColor: string;
    fillOpacity: number;
    clickable: boolean;
  }) => NaverCircle;
  Position: { BOTTOM_LEFT: number };
  Event: {
    addListener(
      target: object,
      eventName: string,
      handler: () => void,
    ): NaverListener;
    removeListener(listener: NaverListener | NaverListener[]): void;
    trigger(target: object, eventName: string): void;
  };
};
