import { Helmet } from 'react-helmet';

const SEO = ({
  title = "程人頻道",
  description = "程人聊天室",
  url,
  children
}) => (
  <Helmet>
    <meta charSet="utf-8" />
    <title>{title}</title>
    <meta name="description" content={description} />
    {children}
    {
      url ? (
        <link rel="canonical" href={url} />
      ) : ""
    }
  </Helmet>
)

export default SEO;