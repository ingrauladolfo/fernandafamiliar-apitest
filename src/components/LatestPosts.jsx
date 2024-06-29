import React, { useState, useEffect, useReducer } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";

const initialState = {
  loading: false,
  posts: [],
  error: "",
};

const reducer = (state, action) => {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true };
    case "FETCH_SUCCESS":
      return { ...state, loading: false, posts: action.payload };
    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };
    case "MARK_ALL_READ":
      return {
        ...state,
        posts: state.posts.map((post) => ({
          ...post,
          read: true,
        })),
      };
    case "MARK_ALL_UNREAD":
      return {
        ...state,
        posts: state.posts.map((post) => ({
          ...post,
          read: false,
        })),
      };
    case "TOGGLE_READ":
      return {
        ...state,
        posts: state.posts.map((post) =>
          post.id === action.payload ? { ...post, read: !post.read } : post
        ),
      };
    default:
      return state;
  }
};

const LatestPosts = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    dispatch({ type: "FETCH_START" });
    axios
      .get(`/wp-json/wp/v2/posts?per_page=10&_embed`)
      .then((res) => {
        const posts = res.data;
        const authorPromises = posts.map((post) => {
          const authorUrl = post._links.author[0].href;
          return axios.get(authorUrl).then((res) => {
            post.authorName = res.data.name;
            post.authorAvatar = res.data.avatar_urls["48"];
            return post;
          });
        });

        Promise.all(authorPromises)
          .then((postsWithAuthors) => {
            dispatch({ type: "FETCH_SUCCESS", payload: postsWithAuthors });
          })
          .catch((err) => {
            dispatch({ type: "FETCH_ERROR", payload: err.message });
          });
      })
      .catch((err) => {
        dispatch({
          type: "FETCH_ERROR",
          payload: err.response ? err.response.data : err.message,
        });
      });
  }, []);

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    const formattedDate = date.toLocaleDateString();
    const formattedTime = date.toLocaleTimeString();
    return `${formattedDate} a las ${formattedTime}`;
  };

  const calculateReadingTime = (content) => {
    const wordsPerMinute = 200;
    const text = content.replace(/<[^>]+>/g, "");
    const wordCount = text.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);
    return `${readingTime} minuto${readingTime > 1 ? "s" : ""} de lectura`;
  };

  const markAllAsRead = () => {
    dispatch({ type: "MARK_ALL_READ" });
    Swal.fire({
      icon: "success",
      title: "Todas las notas marcadas como leídas",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const markAllAsUnread = () => {
    dispatch({ type: "MARK_ALL_UNREAD" });
    Swal.fire({
      icon: "success",
      title: "Todas las notas marcadas como no leídas",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const toggleReadStatus = (postId) => {
    dispatch({ type: "TOGGLE_READ", payload: postId });
  };

  const { loading, posts, error } = state;

  return (
    <div className="p-4 gap-5">
      {loading && (
        <div className="flex items-center justify-center h-screen">
          <FontAwesomeIcon icon={faSpinner} spin size="3x" />
        </div>
      )}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!loading && !error && (
        <>
          <h1 className="text-2xl font-bold mb-4 pb-4 text-center">
            Últimos posts de Fernanda Familiar
          </h1>
          <div className="flex justify-center mb-4">
            <div className="flex space-x-4">
              <button
                className="bg-blue-500 text-white px-3 py-2 rounded-full text-sm font-semibold"
                onClick={markAllAsRead}
              >
                Marcar todas como leídas
              </button>
              <button
                className="bg-red-500 text-white px-3 py-2 rounded-full text-sm font-semibold"
                onClick={markAllAsUnread}
              >
                Marcar todas como no leídas
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 justify-center align-middle">
            {posts.map((post) => (
              <article
                className={`w-full md:w-1/3 p-4 border border-gray-300 rounded-lg shadow-lg transition-transform transform hover:-translate-y-1 ${
                  post.read ? "bg-gray-200 text-black" : ""
                }`}
                key={post.id}
              >
                <img
                  src={post.jetpack_featured_media_url}
                  alt={post.title.rendered}
                  className="w-full h-auto rounded-t-lg"
                />
                <h2 className="text-xl font-semibold mt-2">
                  {post.title.rendered}
                </h2>
                <p
                  className={`text-sm text-white ${
                    post.read ? "bg-gray-200 text-black" : ""
                  }`}
                >
                  Fecha de publicación: {formatDateTime(post.date)}
                </p>
                <p
                  className={`text-sm text-white ${
                    post.read ? "bg-gray-200 text-black" : ""
                  }`}
                >
                  {" "}
                  Fecha de modificación: {formatDateTime(post.modified)}
                </p>
                <div
                  className="text-sm mt-2"
                  dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
                />
                <footer className="flex items-center justify-between leading-none p-2 md:p-4">
                  <div className="flex items-center space-x-2">
                    <img
                      alt={post.authorName}
                      className="block rounded-full"
                      src={post.authorAvatar}
                    />
                    <p className="text-sm">Por: {post.authorName}</p>
                  </div>
                  <a
                    href={post.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-500 text-white text-center px-3 py-2 rounded-full text-sm font-semibold"
                  >
                    {calculateReadingTime(post.content.rendered)}
                  </a>
                  &nbsp;
                  <button
                    className={`${
                      post.read
                        ? "bg-red-500 text-white"
                        : "bg-blue-500 text-white"
                    } px-3 py-2 rounded-full text-sm font-semibold`}
                    onClick={() => toggleReadStatus(post.id)}
                  >
                    {post.read ? "Marcada como leída" : "Marcar como leída"}
                  </button>
                </footer>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LatestPosts;
