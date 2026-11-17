import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMeta } from "../utils/metaSlice";

// const { meta, status, retry } = useMeta();  meta is null until loaded.
export default function useMeta() {
  const dispatch = useDispatch();
  const { data, status } = useSelector((state) => state.meta);

  useEffect(() => {
    if (status === "idle") dispatch(fetchMeta());
  }, [dispatch, status]);

  const retry = useCallback(() => dispatch(fetchMeta()), [dispatch]);
  return { meta: data, status, retry };
}
