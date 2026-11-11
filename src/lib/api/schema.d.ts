/* eslint-disable */
// 자동 생성 파일입니다. 직접 수정하지 말고 `pnpm api:generate`로 갱신하세요.
export interface paths {
    "/api/users/me/medical-profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 내 의료 프로필 조회
         * @description 내 의료 프로필을 조회합니다. 저장한 적이 없으면 404입니다.
         */
        get: operations["get"];
        /**
         * 내 의료 프로필 저장
         * @description 내 의료 프로필을 저장합니다. 없으면 만들고, 있으면 통째로 교체합니다.
         */
        put: operations["save"];
        post?: never;
        /**
         * 내 의료 프로필 삭제
         * @description 내 의료 프로필을 삭제합니다.
         */
        delete: operations["remove"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/me/favorites/{ykiho}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 병원 찜
         * @description 병원을 찜합니다. 이미 찜했어도 204를 돌려주고, 없는 병원이면 404입니다.
         */
        post: operations["add"];
        /**
         * 병원 찜 해제
         * @description 찜을 해제합니다. 찜하지 않은 병원이어도 204를 돌려줍니다.
         */
        delete: operations["remove_1"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/reviews/{reviewId}/reports": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 후기 신고
         * @description 없는 후기면 404, 내 후기면 400, 이미 신고했으면 409입니다.
         */
        post: operations["report"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/hospitals/{ykiho}/reviews": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 병원 후기 목록 조회
         * @description 병원의 후기를 한 페이지씩 조회합니다. 로그인하지 않아도 호출할 수 있고, 로그인했으면 내가 쓴 후기에 mine=true가 붙습니다. 없는 병원이면 404입니다.
         */
        get: operations["getHospitalReviews"];
        put?: never;
        /**
         * 병원 후기 작성
         * @description 병원에 후기를 씁니다. 없는 병원이나 비급여 항목이면 404입니다.
         */
        post: operations["create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 토큰 재발급
         * @description Refresh Token으로 새 토큰을 발급합니다. 토큰이 올바르지 않으면 INVALID_REFRESH_TOKEN, 만료됐으면 EXPIRED_REFRESH_TOKEN, 회원이 없으면 USER_NOT_FOUND입니다.
         */
        post: operations["refresh"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 로그아웃
         * @description Refresh Token을 폐기합니다.
         */
        post: operations["logout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 내 정보 조회
         * @description 로그인한 회원의 정보를 조회합니다. 회원이 없으면 USER_NOT_FOUND(401)입니다.
         */
        get: operations["me"];
        put?: never;
        post?: never;
        /**
         * 회원 탈퇴
         * @description 회원을 탈퇴 처리합니다. 성공하면 프론트는 가지고 있던 토큰을 지워야 합니다. 회원이 없으면 USER_NOT_FOUND(401)입니다.
         */
        delete: operations["withdraw"];
        options?: never;
        head?: never;
        /**
         * 내 정보 수정
         * @description 내 이름을 수정하고 바뀐 회원 정보를 돌려줍니다. 회원이 없으면 USER_NOT_FOUND(401)입니다.
         */
        patch: operations["updateMe"];
        trace?: never;
    };
    "/api/reviews/{reviewId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * 내 후기 삭제
         * @description 없는 후기면 404, 남의 후기면 403입니다.
         */
        delete: operations["remove_2"];
        options?: never;
        head?: never;
        /**
         * 내 후기 수정
         * @description 보낸 값만 바꿉니다. 없는 후기면 404, 남의 후기면 403입니다.
         */
        patch: operations["update"];
        trace?: never;
    };
    "/api/admin/reports/{reportId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * 신고 처리
         * @description action이 HIDE_REVIEW면 후기를 숨기고, DISMISS면 신고를 기각합니다. 없는 신고면 404, 이미 처리한 신고면 409입니다.
         */
        patch: operations["resolve"];
        trace?: never;
    };
    "/api/users/me/reviews": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 내 후기 목록 조회
         * @description 내가 쓴 후기를 최신순으로 조회합니다. 숨김 처리된 후기도 포함합니다.
         */
        get: operations["getMyReviews"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/me/histories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 내 최근 기록 조회
         * @description 내 최근 기록을 최신순으로 조회합니다. 로그인한 채로 병원 상세, 비급여 항목 상세, 병원 검색을 하면 자동으로 쌓입니다.
         */
        get: operations["getHistories"];
        put?: never;
        post?: never;
        /**
         * 내 최근 기록 전체 삭제
         * @description 내 최근 기록을 모두 지웁니다.
         */
        delete: operations["removeAll"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/me/favorites": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 내 찜한 병원 목록 조회
         * @description 내가 찜한 병원을 최근에 찜한 순으로 조회합니다.
         */
        get: operations["getFavorites"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/regions/sido": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 시도 목록 조회
         * @description 전체 시도 목록을 조회합니다.
         */
        get: operations["getSidoList"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/regions/sido/{sidoCode}/sggu": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 시군구 목록 조회
         * @description 시도에 속한 시군구 목록을 조회합니다. 없는 시도 코드면 404입니다.
         */
        get: operations["getSgguList"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/npay-items": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 비급여 항목 검색
         * @description 키워드와 카테고리 코드로 비급여 항목을 한 페이지씩 검색합니다. 조건은 모두 선택입니다.
         */
        get: operations["searchItems"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/npay-items/{npayCode}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 비급여 항목 상세 조회
         * @description 비급여 항목 상세를 조회합니다. 로그인했으면 최근 본 기록에 남기고, 없는 코드면 404입니다.
         */
        get: operations["getItem"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/npay-items/{npayCode}/prices": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 항목별 병원 가격 목록 조회
         * @description 비급여 항목의 병원별 가격을 한 페이지씩 조회합니다. 시도·시군구·종별로 좁힐 수 있고 정렬은 price_asc(기본) 또는 price_desc입니다. 없는 코드면 404입니다.
         */
        get: operations["getPrices"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/npay-items/{npayCode}/price-summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 항목 가격 요약 조회
         * @description 비급여 항목의 최저·최고·평균 가격과 건수를 조회합니다. 시도·시군구·종별로 좁힐 수 있고, 없는 코드면 404입니다.
         */
        get: operations["getPriceSummary"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/npay-items/categories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 비급여 카테고리 목록 조회
         * @description 비급여 카테고리를 중분류 > 소분류 구조로 조회합니다.
         */
        get: operations["getCategories"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/institution-types": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 요양기관 종별 목록 조회
         * @description 요양기관 종별 목록을 조회합니다. 병원 검색의 종별 필터에 사용합니다.
         */
        get: operations["getClassList"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/hospitals": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 병원 검색
         * @description 키워드(필수)와 시도·시군구·종별 조건으로 병원을 한 페이지씩 검색합니다. 로그인했으면 첫 페이지 조회 시 검색어를 최근 기록에 남깁니다.
         */
        get: operations["search"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/hospitals/{ykiho}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 병원 상세 조회
         * @description 병원 상세 정보를 조회합니다. 로그인했으면 최근 본 기록에 남기고, 없는 병원이면 404입니다.
         */
        get: operations["getHospital"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/hospitals/{ykiho}/prices": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 병원 비급여 가격 목록 조회
         * @description 병원의 비급여 가격을 한 페이지씩 조회합니다. 카테고리 코드와 키워드로 좁힐 수 있고, 없는 병원이면 404입니다.
         */
        get: operations["getPrices_1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/hospitals/{ykiho}/prices/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 병원 비급여 가격 추이 조회
         * @description 병원의 비급여 항목 하나에 대한 월별 가격 추이를 조회합니다. 기간(YYYY-MM)이 거꾸로면 400, 없는 병원이나 항목이면 404입니다.
         */
        get: operations["getPriceHistory"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/hospitals/nearby": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 주변 병원 조회
         * @description 위도·경도(필수)와 반경(m, 기본 1000) 안의 병원을 가까운 순으로 조회합니다. 종별과 비급여 코드로 좁힐 수 있고, 없는 비급여 코드면 404입니다.
         */
        get: operations["searchNearby"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/comparisons": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 병원 비교표 조회
         * @description 병원 여러 곳의 비급여 항목 가격을 비교표로 조회합니다. ykihos는 필수이며 쉼표로 구분해 최대 5개, npayCodes는 선택이며 쉼표로 구분해 최대 20개입니다. 예: /api/comparisons?ykihos=A,B,C&npayCodes=MX1220000. 없는 병원이나 항목이면 404입니다.
         */
        get: operations["compare"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/reports": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 신고 목록 조회
         * @description 신고를 한 페이지씩 조회합니다. condition의 status는 PENDING 또는 RESOLVED이고, 없으면 전체를 조회합니다. page는 0부터, size는 1~100(기본 20)입니다.
         */
        get: operations["getReports"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/batch-status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 데이터 동기화 상태 조회
         * @description 데이터 동기화(배치) Job별 최근 실행과 Step 결과를 조회합니다.
         */
        get: operations["getBatchStatus"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/me/histories/{historyId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * 내 최근 기록 삭제
         * @description 내 최근 기록 하나를 지웁니다. 없는 기록이거나 다른 회원의 기록이면 404입니다.
         */
        delete: operations["remove_3"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        MedicalProfileRequest: {
            /** Format: int32 */
            birthYear?: number;
            gender?: string;
            chronicConditions?: string;
            medications?: string;
            allergies?: string;
            note?: string;
        };
        MedicalProfileResponse: {
            /** Format: int32 */
            birthYear: number | null;
            gender: string | null;
            chronicConditions: string | null;
            medications: string | null;
            allergies: string | null;
            note: string | null;
            /** Format: date-time */
            updatedAt: string;
        };
        ReviewReportRequest: {
            /** @enum {string} */
            reason: "SPAM" | "ABUSE" | "FALSE_INFO" | "PRIVACY" | "ETC";
            detail?: string;
        };
        ReviewCreateRequest: {
            /** Format: int32 */
            rating: number;
            content: string;
            npayCode?: string;
            /** Format: int64 */
            paidAmount?: number;
            /** Format: date */
            visitedOn?: string;
        };
        ReviewResponse: {
            /** Format: int64 */
            id: number;
            ykiho: string;
            hospitalName: string | null;
            authorName: string | null;
            mine: boolean;
            /** Format: int32 */
            rating: number;
            content: string;
            npayCode: string | null;
            /** Format: int64 */
            paidAmount: number | null;
            /** Format: date */
            visitedOn: string | null;
            /** @enum {string} */
            status: "ACTIVE" | "HIDDEN";
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        RefreshRequest: {
            refreshToken: string;
        };
        TokenResponse: {
            accessToken: string;
            refreshToken: string;
            tokenType: string;
            /** Format: int64 */
            expiresIn: number;
        };
        UpdateMeRequest: {
            name: string;
        };
        UserResponse: {
            /** Format: int64 */
            id: number;
            email: string;
            name: string | null;
            profileImageUrl: string | null;
            role: string;
        };
        ReviewUpdateRequest: {
            /** Format: int32 */
            rating?: number;
            content?: string;
            /** Format: int64 */
            paidAmount?: number;
            /** Format: date */
            visitedOn?: string;
        };
        ResolveReportRequest: {
            /** @enum {string} */
            action: "HIDE_REVIEW" | "DISMISS";
        };
        AdminReportResponse: {
            /** Format: int64 */
            id: number;
            /** Format: int64 */
            reporterId: number;
            reason: string;
            detail: string | null;
            status: string;
            action: string | null;
            /** Format: int64 */
            resolvedBy: number | null;
            /** Format: date-time */
            resolvedAt: string | null;
            /** Format: date-time */
            createdAt: string;
            review: components["schemas"]["ReportedReview"] | null;
        };
        ReportedReview: {
            /** Format: int64 */
            id: number;
            ykiho: string;
            /** Format: int64 */
            authorId: number | null;
            /** Format: int32 */
            rating: number;
            content: string;
            status: string;
            /** Format: date-time */
            createdAt: string;
        };
        PageQuery: {
            /** Format: int32 */
            page?: number;
            /** Format: int32 */
            size?: number;
        };
        PageResponseReviewResponse: {
            content: components["schemas"]["ReviewResponse"][];
            /** Format: int32 */
            page: number;
            /** Format: int32 */
            size: number;
            /** Format: int64 */
            totalElements: number;
            /** Format: int32 */
            totalPages: number;
        };
        PageResponseViewHistoryResponse: {
            content: components["schemas"]["ViewHistoryResponse"][];
            /** Format: int32 */
            page: number;
            /** Format: int32 */
            size: number;
            /** Format: int64 */
            totalElements: number;
            /** Format: int32 */
            totalPages: number;
        };
        ViewHistoryResponse: {
            /** Format: int64 */
            id: number;
            /** @enum {string} */
            type: "HOSPITAL" | "NPAY_ITEM" | "KEYWORD";
            targetKey: string;
            title: string | null;
            /** Format: date-time */
            viewedAt: string;
        };
        FavoriteHospitalResponse: {
            ykiho: string;
            available: boolean;
            name: string | null;
            className: string | null;
            address: string | null;
            phone: string | null;
            /** Format: date-time */
            favoritedAt: string;
        };
        PageResponseFavoriteHospitalResponse: {
            content: components["schemas"]["FavoriteHospitalResponse"][];
            /** Format: int32 */
            page: number;
            /** Format: int32 */
            size: number;
            /** Format: int64 */
            totalElements: number;
            /** Format: int32 */
            totalPages: number;
        };
        SidoResponse: {
            code: string;
            name: string;
        };
        SgguResponse: {
            code: string;
            name: string;
            sidoCode: string;
        };
        NpayItemSearchCondition: {
            keyword?: string;
            categoryCode?: string;
        };
        NpayItemResponse: {
            code: string;
            name: string;
            mdivCode: string | null;
            mdivName: string | null;
            sdivCode: string | null;
            sdivName: string | null;
        };
        PageResponseNpayItemResponse: {
            content: components["schemas"]["NpayItemResponse"][];
            /** Format: int32 */
            page: number;
            /** Format: int32 */
            size: number;
            /** Format: int64 */
            totalElements: number;
            /** Format: int32 */
            totalPages: number;
        };
        NpayItemDetailResponse: {
            code: string;
            name: string;
            mdivCode: string | null;
            mdivName: string | null;
            sdivCode: string | null;
            sdivName: string | null;
            detailCode: string | null;
            detailName: string | null;
            description: string | null;
            /** Format: date */
            startDate: string | null;
            /** Format: date */
            endDate: string | null;
        };
        PriceSearchCondition: {
            sidoCode?: string;
            sgguCode?: string;
            institutionCode?: string;
        };
        PriceSortCondition: {
            sort?: string;
        };
        HospitalPriceResponse: {
            ykiho: string;
            hospitalName: string;
            className: string | null;
            sidoName: string | null;
            sgguName: string | null;
            address: string | null;
            itemName: string | null;
            /** Format: int64 */
            price: number;
            /** Format: date */
            startDate: string | null;
        };
        PageResponseHospitalPriceResponse: {
            content: components["schemas"]["HospitalPriceResponse"][];
            /** Format: int32 */
            page: number;
            /** Format: int32 */
            size: number;
            /** Format: int64 */
            totalElements: number;
            /** Format: int32 */
            totalPages: number;
        };
        PriceSummaryResponse: {
            npayCode: string;
            /** Format: int64 */
            minPrice: number | null;
            /** Format: int64 */
            maxPrice: number | null;
            /** Format: int64 */
            avgPrice: number | null;
            /** Format: int64 */
            priceCount: number;
            /** Format: int64 */
            hospitalCount: number;
        };
        NpayCategoryResponse: {
            code: string;
            name: string | null;
            subCategories: components["schemas"]["SubCategory"][];
        };
        SubCategory: {
            code: string | null;
            name: string | null;
        };
        InstitutionClassResponse: {
            code: string;
            name: string;
        };
        HospitalSearchCondition: {
            keyword: string;
            sidoCode?: string;
            sgguCode?: string;
            institutionCode?: string;
        };
        HospitalSummaryResponse: {
            ykiho: string;
            name: string;
            className: string | null;
            sidoName: string | null;
            sgguName: string | null;
            address: string | null;
            phone: string | null;
        };
        PageResponseHospitalSummaryResponse: {
            content: components["schemas"]["HospitalSummaryResponse"][];
            /** Format: int32 */
            page: number;
            /** Format: int32 */
            size: number;
            /** Format: int64 */
            totalElements: number;
            /** Format: int32 */
            totalPages: number;
        };
        ClosedNotice: {
            sunday: string | null;
            holiday: string | null;
        };
        DayHours: {
            day: string;
            start: string | null;
            end: string | null;
        };
        Emergency: {
            dayYn: string | null;
            nightYn: string | null;
        };
        HospitalDetailResponse: {
            ykiho: string;
            name: string;
            className: string | null;
            sidoName: string | null;
            sgguName: string | null;
            emdongName: string | null;
            postNo: string | null;
            address: string | null;
            phone: string | null;
            homepage: string | null;
            /** Format: double */
            latitude: number | null;
            /** Format: double */
            longitude: number | null;
            /** Format: int32 */
            doctorCount: number | null;
            /** Format: date */
            openedDate: string | null;
            operatingInfo: components["schemas"]["OperatingInfo"] | null;
        };
        OperatingInfo: {
            hours: components["schemas"]["DayHours"][];
            lunch: components["schemas"]["WeekSchedule"];
            reception: components["schemas"]["WeekSchedule"];
            closed: components["schemas"]["ClosedNotice"];
            parking: components["schemas"]["Parking"];
            emergency: components["schemas"]["Emergency"];
        };
        Parking: {
            count: string | null;
            feeYn: string | null;
            note: string | null;
        };
        WeekSchedule: {
            weekday: string | null;
            saturday: string | null;
        };
        ReviewSortCondition: {
            sort?: string;
        };
        HospitalPriceCondition: {
            categoryCode?: string;
            keyword?: string;
        };
        HospitalItemPriceResponse: {
            npayCode: string;
            itemName: string;
            categoryName: string | null;
            hospitalItemName: string | null;
            /** Format: int64 */
            price: number;
            /** Format: date */
            startDate: string | null;
        };
        PageResponseHospitalItemPriceResponse: {
            content: components["schemas"]["HospitalItemPriceResponse"][];
            /** Format: int32 */
            page: number;
            /** Format: int32 */
            size: number;
            /** Format: int64 */
            totalElements: number;
            /** Format: int32 */
            totalPages: number;
        };
        PriceHistoryCondition: {
            npayCode: string;
            from?: string;
            to?: string;
            reversed?: boolean;
        };
        Point: {
            month: string;
            /** Format: int64 */
            price: number;
        };
        PriceHistoryResponse: {
            ykiho: string;
            npayCode: string;
            series: components["schemas"]["Series"][];
        };
        Series: {
            hospitalItemName: string | null;
            points: components["schemas"]["Point"][];
        };
        NearbyCondition: {
            /** Format: double */
            lat: number;
            /** Format: double */
            lng: number;
            /** Format: int32 */
            radius?: number;
            institutionCode?: string;
            npayCode?: string;
        };
        NearbyHospitalResponse: {
            ykiho: string;
            name: string;
            className: string | null;
            address: string | null;
            phone: string | null;
            /** Format: double */
            latitude: number | null;
            /** Format: double */
            longitude: number | null;
            /** Format: int64 */
            distanceMeters: number;
            /** Format: int64 */
            minPrice: number | null;
        };
        PageResponseNearbyHospitalResponse: {
            content: components["schemas"]["NearbyHospitalResponse"][];
            /** Format: int32 */
            page: number;
            /** Format: int32 */
            size: number;
            /** Format: int64 */
            totalElements: number;
            /** Format: int32 */
            totalPages: number;
        };
        ComparisonCondition: {
            ykihos: string[];
            npayCodes?: string[];
        };
        ComparisonResponse: {
            hospitals: components["schemas"]["HospitalColumn"][];
            items: components["schemas"]["ItemRow"][];
            truncated: boolean;
        };
        HospitalColumn: {
            ykiho: string;
            name: string;
            className: string | null;
            sidoName: string | null;
            sgguName: string | null;
            address: string | null;
            phone: string | null;
        };
        ItemRow: {
            npayCode: string;
            itemName: string;
            categoryName: string | null;
            prices: components["schemas"]["PriceCell"][];
            cheapestYkiho: string | null;
        };
        PriceCell: {
            ykiho: string;
            /** Format: int64 */
            minPrice: number | null;
            /** Format: int64 */
            maxPrice: number | null;
            /** Format: int64 */
            priceCount: number;
        };
        ReportListCondition: {
            /** @enum {string} */
            status?: "PENDING" | "RESOLVED";
        };
        PageResponseAdminReportResponse: {
            content: components["schemas"]["AdminReportResponse"][];
            /** Format: int32 */
            page: number;
            /** Format: int32 */
            size: number;
            /** Format: int64 */
            totalElements: number;
            /** Format: int32 */
            totalPages: number;
        };
        BatchStatusResponse: {
            available: boolean;
            jobs: components["schemas"]["JobStatus"][];
        };
        JobStatus: {
            jobName: string;
            /** Format: int64 */
            executionId: number;
            status: string | null;
            exitCode: string | null;
            exitMessage: string | null;
            /** Format: date-time */
            startTime: string | null;
            /** Format: date-time */
            endTime: string | null;
            steps: components["schemas"]["StepStatus"][];
        };
        StepStatus: {
            stepName: string;
            status: string | null;
            /** Format: int64 */
            readCount: number;
            /** Format: int64 */
            writeCount: number;
            /** Format: int64 */
            skipCount: number;
            /** Format: date-time */
            startTime: string | null;
            /** Format: date-time */
            endTime: string | null;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["MedicalProfileResponse"];
                };
            };
        };
    };
    save: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["MedicalProfileRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["MedicalProfileResponse"];
                };
            };
        };
    };
    remove: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 삭제됨 */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    add: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 병원 고유키 */
                ykiho: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 찜함 */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    remove_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 병원 고유키 */
                ykiho: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 해제됨 */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    report: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 후기 번호 */
                reviewId: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReviewReportRequest"];
            };
        };
        responses: {
            /** @description 접수됨 */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    getHospitalReviews: {
        parameters: {
            query: {
                sortCondition: components["schemas"]["ReviewSortCondition"];
                pageQuery: components["schemas"]["PageQuery"];
            };
            header?: never;
            path: {
                /** @description 병원 고유키 */
                ykiho: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PageResponseReviewResponse"];
                };
            };
        };
    };
    create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 병원 고유키 */
                ykiho: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReviewCreateRequest"];
            };
        };
        responses: {
            /** @description 작성된 후기 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ReviewResponse"];
                };
            };
        };
    };
    refresh: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RefreshRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TokenResponse"];
                };
            };
        };
    };
    logout: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RefreshRequest"];
            };
        };
        responses: {
            /** @description 폐기됨 */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    me: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["UserResponse"];
                };
            };
        };
    };
    withdraw: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 탈퇴됨 */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    updateMe: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateMeRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["UserResponse"];
                };
            };
        };
    };
    remove_2: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 후기 번호 */
                reviewId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 삭제됨 */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 후기 번호 */
                reviewId: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReviewUpdateRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ReviewResponse"];
                };
            };
        };
    };
    resolve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 신고 번호 */
                reportId: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ResolveReportRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["AdminReportResponse"];
                };
            };
        };
    };
    getMyReviews: {
        parameters: {
            query: {
                pageQuery: components["schemas"]["PageQuery"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PageResponseReviewResponse"];
                };
            };
        };
    };
    getHistories: {
        parameters: {
            query: {
                pageQuery: components["schemas"]["PageQuery"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PageResponseViewHistoryResponse"];
                };
            };
        };
    };
    removeAll: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 삭제됨 */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    getFavorites: {
        parameters: {
            query: {
                pageQuery: components["schemas"]["PageQuery"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PageResponseFavoriteHospitalResponse"];
                };
            };
        };
    };
    getSidoList: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["SidoResponse"][];
                };
            };
        };
    };
    getSgguList: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 시도 코드 (예: 110000) */
                sidoCode: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["SgguResponse"][];
                };
            };
        };
    };
    searchItems: {
        parameters: {
            query: {
                condition: components["schemas"]["NpayItemSearchCondition"];
                pageQuery: components["schemas"]["PageQuery"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PageResponseNpayItemResponse"];
                };
            };
        };
    };
    getItem: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 비급여 코드 (예: MX1220000) */
                npayCode: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["NpayItemDetailResponse"];
                };
            };
        };
    };
    getPrices: {
        parameters: {
            query: {
                condition: components["schemas"]["PriceSearchCondition"];
                sortCondition: components["schemas"]["PriceSortCondition"];
                pageQuery: components["schemas"]["PageQuery"];
            };
            header?: never;
            path: {
                /** @description 비급여 코드 (예: MX1220000) */
                npayCode: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PageResponseHospitalPriceResponse"];
                };
            };
        };
    };
    getPriceSummary: {
        parameters: {
            query: {
                condition: components["schemas"]["PriceSearchCondition"];
            };
            header?: never;
            path: {
                /** @description 비급여 코드 (예: MX1220000) */
                npayCode: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PriceSummaryResponse"];
                };
            };
        };
    };
    getCategories: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["NpayCategoryResponse"][];
                };
            };
        };
    };
    getClassList: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["InstitutionClassResponse"][];
                };
            };
        };
    };
    search: {
        parameters: {
            query: {
                condition: components["schemas"]["HospitalSearchCondition"];
                pageQuery: components["schemas"]["PageQuery"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PageResponseHospitalSummaryResponse"];
                };
            };
        };
    };
    getHospital: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 병원 고유키 */
                ykiho: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["HospitalDetailResponse"];
                };
            };
        };
    };
    getPrices_1: {
        parameters: {
            query: {
                condition: components["schemas"]["HospitalPriceCondition"];
                pageQuery: components["schemas"]["PageQuery"];
            };
            header?: never;
            path: {
                /** @description 병원 고유키 */
                ykiho: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PageResponseHospitalItemPriceResponse"];
                };
            };
        };
    };
    getPriceHistory: {
        parameters: {
            query: {
                condition: components["schemas"]["PriceHistoryCondition"];
            };
            header?: never;
            path: {
                /** @description 병원 고유키 */
                ykiho: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PriceHistoryResponse"];
                };
            };
        };
    };
    searchNearby: {
        parameters: {
            query: {
                condition: components["schemas"]["NearbyCondition"];
                pageQuery: components["schemas"]["PageQuery"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PageResponseNearbyHospitalResponse"];
                };
            };
        };
    };
    compare: {
        parameters: {
            query: {
                condition: components["schemas"]["ComparisonCondition"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ComparisonResponse"];
                };
            };
        };
    };
    getReports: {
        parameters: {
            query: {
                condition: components["schemas"]["ReportListCondition"];
                pageQuery: components["schemas"]["PageQuery"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PageResponseAdminReportResponse"];
                };
            };
        };
    };
    getBatchStatus: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["BatchStatusResponse"];
                };
            };
        };
    };
    remove_3: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 기록 번호 */
                historyId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 삭제됨 */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
}
