import axios from "axios";
import { BASE_URL } from "../utils/constant";
import { useEffect } from "react";
import { addFeed } from "../utils/feedSlice";
import { useDispatch, useSelector } from "react-redux";
import UserCard from "./UserCard";

function Feed() {
  const dispatch = useDispatch();
  const feedData = useSelector((state) => state.feed);

  const fetchFeed = async () => {
    if (feedData.length) return;
    try {
      const response = await axios.get(`${BASE_URL}/user/feed`, {
        withCredentials: true,
      });
      console.log("Feed data:", response.data);
      dispatch(addFeed(response.data));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  return (
    <div className="feed">
      {feedData.map((item) => (
        <UserCard key={item._id} user={item} />
      ))}
    </div>
  );
}

export default Feed;
