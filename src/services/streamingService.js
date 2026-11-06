/**
 * Streaming Availability Service
 * Works in development (via Vite proxy) and in production (via Vercel Serverless / Netlify Redirects).
 * Also includes an automatic fallback for purely static hosts (like GitHub Pages).
 */

const FALLBACK_PLATFORMS = {
  IN: [
    {
      name: "JioHotstar",
      shortName: "jhs",
      icon: "https://images.justwatch.com/icon/326071631/s100/jiohotstar.png",
      getUrl: (title) => `https://www.hotstar.com/in/search?q=${encodeURIComponent(title)}`,
      monetizationType: "FLATRATE",
    },
    {
      name: "Netflix",
      shortName: "nfx",
      icon: "https://images.justwatch.com/icon/207360008/s100/netflix.png",
      getUrl: (title) => `https://www.netflix.com/search?q=${encodeURIComponent(title)}`,
      monetizationType: "FLATRATE",
    },
    {
      name: "Amazon Prime Video",
      shortName: "prv",
      icon: "https://images.justwatch.com/icon/322992749/s100/amazonprimevideo.png",
      getUrl: (title) => `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${encodeURIComponent(title)}`,
      monetizationType: "FLATRATE",
    },
    {
      name: "JioCinema",
      shortName: "jio",
      icon: "https://images.justwatch.com/icon/305458112/s100/jiocinema.png",
      getUrl: (title) => `https://www.jiocinema.com/search/${encodeURIComponent(title)}`,
      monetizationType: "FLATRATE",
    },
    {
      name: "Apple TV Store",
      shortName: "itu",
      icon: "https://images.justwatch.com/icon/338253243/s100/itunes.png",
      getUrl: (title) => `https://tv.apple.com/search?term=${encodeURIComponent(title)}`,
      monetizationType: "RENT",
    },
  ],
  US: [
    {
      name: "Netflix",
      shortName: "nfx",
      icon: "https://images.justwatch.com/icon/207360008/s100/netflix.png",
      getUrl: (title) => `https://www.netflix.com/search?q=${encodeURIComponent(title)}`,
      monetizationType: "FLATRATE",
    },
    {
      name: "Amazon Prime Video",
      shortName: "prv",
      icon: "https://images.justwatch.com/icon/322992749/s100/amazonprimevideo.png",
      getUrl: (title) => `https://www.amazon.com/s?k=${encodeURIComponent(title)}&i=instant-video`,
      monetizationType: "FLATRATE",
    },
    {
      name: "Disney+",
      shortName: "dnp",
      icon: "https://images.justwatch.com/icon/147630338/s100/disneyplus.png",
      getUrl: (title) => `https://www.disneyplus.com/search?q=${encodeURIComponent(title)}`,
      monetizationType: "FLATRATE",
    },
    {
      name: "Apple TV",
      shortName: "itu",
      icon: "https://images.justwatch.com/icon/338253243/s100/itunes.png",
      getUrl: (title) => `https://tv.apple.com/search?term=${encodeURIComponent(title)}`,
      monetizationType: "RENT",
    },
  ],
};

export async function fetchStreamingAvailability(movieTitle, country = "IN") {
  if (!movieTitle) return null;

  const query = `query GetPopularTitles($country: Country!, $first: Int!, $popularTitlesFilter: TitleFilter) {
    popularTitles(first: $first, filter: $popularTitlesFilter, country: $country) {
      edges {
        node {
          id
          content(country: $country, language: "en") {
            title
            originalReleaseYear
          }
          offers(country: $country, platform: WEB) {
            monetizationType
            presentationType
            package {
              packageId
              clearName
              shortName
              icon
            }
            standardWebURL
          }
        }
      }
    }
  }`;

  const payload = {
    operationName: "GetPopularTitles",
    variables: {
      first: 1,
      popularTitlesFilter: {
        searchQuery: movieTitle,
      },
      country: country,
    },
    query: query,
  };

  try {
    const res = await fetch("/api/justwatch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Proxy endpoint returned status ${res.status}`);
    }

    const data = await res.json();
    const firstMatch = data?.data?.popularTitles?.edges?.[0]?.node;

    if (!firstMatch || !firstMatch.offers) {
      return {
        matchedTitle: firstMatch?.content?.title || null,
        stream: [],
        rent: [],
        buy: [],
        hasAny: false,
        isStaticFallback: false,
      };
    }

    const offers = firstMatch.offers;
    const streamMap = new Map();
    const rentMap = new Map();
    const buyMap = new Map();

    const getIconUrl = (iconPath) => {
      if (!iconPath) return null;
      return `https://images.justwatch.com${iconPath
        .replace("{profile}", "s100")
        .replace("{format}", "png")}`;
    };

    offers.forEach((offer) => {
      const pkg = offer.package;
      if (!pkg || !pkg.clearName) return;

      const item = {
        name: pkg.clearName,
        shortName: pkg.shortName,
        icon: getIconUrl(pkg.icon),
        url: offer.standardWebURL,
        monetizationType: offer.monetizationType,
      };

      const key = pkg.clearName.toLowerCase();

      if (offer.monetizationType === "FLATRATE" || offer.monetizationType === "FREE") {
        if (!streamMap.has(key)) streamMap.set(key, item);
      } else if (offer.monetizationType === "RENT") {
        if (!rentMap.has(key)) rentMap.set(key, item);
      } else if (offer.monetizationType === "BUY") {
        if (!buyMap.has(key)) buyMap.set(key, item);
      }
    });

    const stream = Array.from(streamMap.values());
    const rent = Array.from(rentMap.values());
    const buy = Array.from(buyMap.values());

    return {
      matchedTitle: firstMatch.content?.title || movieTitle,
      stream,
      rent,
      buy,
      hasAny: stream.length > 0 || rent.length > 0 || buy.length > 0,
      isStaticFallback: false,
    };
  } catch (err) {
    console.warn("API proxy not available (likely purely static hosting environment). Using resilient fallback.", err);

    // Return resilient fallback data for purely static deployment
    const fallbackList = FALLBACK_PLATFORMS[country] || FALLBACK_PLATFORMS.IN;
    const stream = fallbackList
      .filter((p) => p.monetizationType === "FLATRATE")
      .map((p) => ({
        name: p.name,
        shortName: p.shortName,
        icon: p.icon,
        url: p.getUrl(movieTitle),
        monetizationType: p.monetizationType,
      }));

    const rent = fallbackList
      .filter((p) => p.monetizationType === "RENT")
      .map((p) => ({
        name: p.name,
        shortName: p.shortName,
        icon: p.icon,
        url: p.getUrl(movieTitle),
        monetizationType: p.monetizationType,
      }));

    return {
      matchedTitle: movieTitle,
      stream,
      rent,
      buy: [],
      hasAny: true,
      isStaticFallback: true,
    };
  }
}
