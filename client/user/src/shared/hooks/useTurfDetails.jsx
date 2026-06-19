import {
  useGetTurfDetailsQuery,
  useGetTurfReviewsQuery,
} from "@redux/api/turfApi";

const useTurfDetails = (turfId) => {
  const {
    data: turfData,
    isLoading: loadingDetails,
    refetch: refetchDetails,
    error: detailsError,
  } = useGetTurfDetailsQuery(turfId, { skip: !turfId });
  const {
    data: reviewsData,
    isLoading: loadingReviews,
    refetch: refetchReviews,
  } = useGetTurfReviewsQuery(turfId, { skip: !turfId });

  const turf = turfData?.turf || null;
  const reviews = reviewsData?.reviews || [];
  const loading = loadingDetails || loadingReviews;
  const error = detailsError ? "Failed to fetch turf details." : null;

  const refetch = () => {
    refetchDetails();
    refetchReviews();
  };

  return { turf, reviews, loading, error, refetch };
};

export default useTurfDetails;
