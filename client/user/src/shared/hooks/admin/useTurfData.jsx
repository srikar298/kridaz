import { useEffect, useState } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import { useParams } from "react-router-dom";

const useTurfData = () => {
  const [turfData, setTurfData] = useState(null);
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);

  const { id: ownerId } = useParams();

  const fetchTurfData = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/api/admin/owners/turf/${ownerId}`
      );
      const result = await response.data;
      setTurfData(result.turfs);
      setOwner(result.owner);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTurfData();
  }, [ownerId]);

  return { turfData, owner, loading };
};

export default useTurfData;
