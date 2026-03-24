/**
 * Social Media Analytics - High-End MongoDB Aggregation Queries
 * Make sure to select `SocialMediaDB` before running these queries: use SocialMediaDB
 */

// 1. Top 5 Most Engaged Users (Combines User data with total Engagement Score from their Posts)
db.Users.aggregate([
    {
        $lookup: {
            from: "Posts",
            localField: "UserID",
            foreignField: "UserID",
            as: "UserPosts"
        }
    },
    { $unwind: { path: "$UserPosts", preserveNullAndEmptyArrays: true } },
    {
        $group: {
            _id: "$UserID",
            Name: { $first: "$Name" },
            TotalEngagement: { $sum: "$UserPosts.EngagementScore" },
            FollowersCount: { $first: "$FollowersCount" }
        }
    },
    { $sort: { TotalEngagement: -1, FollowersCount: -1 } },
    { $limit: 5 }
]);

// 2. Posts with the Most Comments (Join Posts with Comments and count)
db.Posts.aggregate([
    {
        $lookup: {
            from: "Comments",
            localField: "PostID",
            foreignField: "PostID",
            as: "PostComments"
        }
    },
    {
        $project: {
            PostID: 1,
            Content: 1,
            TotalComments: { $size: "$PostComments" }
        }
    },
    { $sort: { TotalComments: -1 } },
    { $limit: 10 }
]);

// 3. Most Popular Hashtags (Unwind tags array and count occurrences)
db.Posts.aggregate([
    { $unwind: "$Tags" },
    {
        $group: {
            _id: "$Tags",
            TagCount: { $sum: 1 }
        }
    },
    { $sort: { TagCount: -1 } },
    { $limit: 10 }
]);

// 4. Users Who Liked Their Own Posts (Self-Engagement)
db.Likes.aggregate([
    {
        $lookup: {
            from: "Posts",
            localField: "PostID",
            foreignField: "PostID",
            as: "PostDetails"
        }
    },
    { $unwind: "$PostDetails" },
    {
        $match: {
            $expr: { $eq: ["$UserID", "$PostDetails.UserID"] }
        }
    },
    {
        $project: {
            UserID: 1,
            PostID: 1,
            "PostDetails.Content": 1
        }
    }
]);

// 5. Average Engagement Score per User
db.Posts.aggregate([
    {
        $group: {
            _id: "$UserID",
            AverageEngagement: { $avg: "$EngagementScore" },
            TotalPosts: { $sum: 1 }
        }
    },
    {
        $lookup: {
            from: "Users",
            localField: "_id",
            foreignField: "UserID",
            as: "UserDetails"
        }
    },
    { $unwind: "$UserDetails" },
    {
        $project: {
            Name: "$UserDetails.Name",
            Email: "$UserDetails.Email",
            AverageEngagement: { $round: ["$AverageEngagement", 2] },
            TotalPosts: 1
        }
    },
    { $sort: { AverageEngagement: -1 } }
]);

// 6. Viral Posts (Find posts that perform significantly higher than the global average using $facet)
db.Posts.aggregate([
    {
        $facet: {
            "GlobalAverage": [
                {
                    $group: {
                        _id: null,
                        AvgScore: { $avg: "$EngagementScore" }
                    }
                }
            ],
            "AllPosts": [{ $match: {} }]
        }
    },
    { $unwind: "$GlobalAverage" },
    { $unwind: "$AllPosts" },
    {
        $match: {
            $expr: { $gt: ["$AllPosts.EngagementScore", "$GlobalAverage.AvgScore"] }
        }
    },
    {
        $replaceRoot: { newRoot: "$AllPosts" }
    },
    { $sort: { EngagementScore: -1 } }
]);

// 7. Most Active Hour for Posting (Extracting hour from Timestamp)
db.Posts.aggregate([
    {
        $project: {
            HourOfDay: { $hour: "$Timestamp" }
        }
    },
    {
        $group: {
            _id: "$HourOfDay",
            PostCount: { $sum: 1 }
        }
    },
    { $sort: { PostCount: -1 } }
]);

// 8. Comment-to-Like Ratio per Post
db.Posts.aggregate([
    {
        $lookup: {
            from: "Likes",
            localField: "PostID",
            foreignField: "PostID",
            as: "PostLikes"
        }
    },
    {
        $lookup: {
            from: "Comments",
            localField: "PostID",
            foreignField: "PostID",
            as: "PostComments"
        }
    },
    {
        $project: {
            PostID: 1,
            Content: 1,
            LikesCount: { $size: "$PostLikes" },
            CommentsCount: { $size: "$PostComments" }
        }
    },
    {
        $project: {
            PostID: 1,
            Content: 1,
            LikesCount: 1,
            CommentsCount: 1,
            CommentToLikeRatio: {
                $cond: [
                    { $eq: ["$LikesCount", 0] },
                    "N/A",
                    { $divide: ["$CommentsCount", "$LikesCount"] }
                ]
            }
        }
    },
    { $sort: { CommentToLikeRatio: -1 } }
]);

// 9. Top Commenters (Users who leave the most comments)
db.Comments.aggregate([
    {
        $group: {
            _id: "$UserID",
            TotalCommentsMade: { $sum: 1 }
        }
    },
    {
        $lookup: {
            from: "Users",
            localField: "_id",
            foreignField: "UserID",
            as: "UserDetails"
        }
    },
    { $unwind: "$UserDetails" },
    {
        $project: {
            Name: "$UserDetails.Name",
            TotalCommentsMade: 1
        }
    },
    { $sort: { TotalCommentsMade: -1 } }
]);

// 10. Users with No Posts but High Followers (Lurkers with large reach)
db.Users.aggregate([
    {
        $lookup: {
            from: "Posts",
            localField: "UserID",
            foreignField: "UserID",
            as: "UserPosts"
        }
    },
    {
        $match: {
            "UserPosts": { $size: 0 }
        }
    },
    { $sort: { FollowersCount: -1 } },
    {
        $project: {
            Name: 1,
            FollowersCount: 1
        }
    }
]);

// 11. Daily Active Users (DAU) by Posts Made (Unique Users per Day)
db.Posts.aggregate([
    {
        $project: {
            DateOnly: { $dateToString: { format: "%Y-%m-%d", date: "$Timestamp" } },
            UserID: 1
        }
    },
    {
        $group: {
            _id: "$DateOnly",
            UniqueUsers: { $addToSet: "$UserID" }
        }
    },
    {
        $project: {
            Date: "$_id",
            DAU: { $size: "$UniqueUsers" }
        }
    },
    { $sort: { Date: -1 } }
]);

// 12. Monthly Follower Growth Potential (Users joined per month with their respective follower sum)
db.Users.aggregate([
    {
        $project: {
            JoinMonth: { $dateToString: { format: "%Y-%m", date: "$JoinDate" } },
            FollowersCount: 1
        }
    },
    {
        $group: {
            _id: "$JoinMonth",
            NewUsers: { $sum: 1 },
            TotalNewFollowers: { $sum: "$FollowersCount" }
        }
    },
    { $sort: { _id: 1 } }
]);

// 13. Complex Hashtag Co-occurrence (Tags used together)
db.Posts.aggregate([
    { $unwind: "$Tags" },
    {
        $lookup: {
            from: "Posts",
            localField: "PostID",
            foreignField: "PostID",
            as: "SamePost"
        }
    },
    { $unwind: "$SamePost" },
    { $unwind: "$SamePost.Tags" },
    {
        $match: {
            $expr: { $ne: ["$Tags", "$SamePost.Tags"] }
        }
    },
    {
        $group: {
            _id: {
                tag1: { $cond: [{ $lt: ["$Tags", "$SamePost.Tags"] }, "$Tags", "$SamePost.Tags"] },
                tag2: { $cond: [{ $lt: ["$Tags", "$SamePost.Tags"] }, "$SamePost.Tags", "$Tags"] }
            },
            CoOccurrenceCount: { $sum: 1 }
        }
    },
    {
        $project: {
            _id: 0,
            Tag1: "$_id.tag1",
            Tag2: "$_id.tag2",
            Count: { $divide: ["$CoOccurrenceCount", 2] } // Divide by 2 to prevent A-B and B-A double counting
        }
    },
    { $sort: { Count: -1 } },
    { $limit: 10 }
]);

// 14. Last Interaction per User (Latest Like or Comment)
db.Users.aggregate([
    {
        $lookup: {
            from: "Likes",
            localField: "UserID",
            foreignField: "UserID",
            as: "UserLikes"
        }
    },
    {
        $lookup: {
            from: "Comments",
            localField: "UserID",
            foreignField: "UserID",
            as: "UserComments"
        }
    },
    {
        $project: {
            Name: 1,
            LastLike: { $max: "$UserLikes.Timestamp" },
            LastComment: { $max: "$UserComments.Timestamp" }
        }
    },
    {
        $project: {
            Name: 1,
            LastInteraction: {
                $max: ["$LastLike", "$LastComment"]
            }
        }
    },
    { $sort: { LastInteraction: -1 } }
]);

// 15. Comprehensive 360 User Profile 
// Detailed array containing User details, their top post, total likes given, and total comments written
db.Users.aggregate([
    {
        $lookup: {
            from: "Posts",
            localField: "UserID",
            foreignField: "UserID",
            as: "UserPosts"
        }
    },
    {
        $lookup: {
            from: "Likes",
            localField: "UserID",
            foreignField: "UserID",
            as: "LikesGiven"
        }
    },
    {
        $lookup: {
            from: "Comments",
            localField: "UserID",
            foreignField: "UserID",
            as: "CommentsGiven"
        }
    },
    {
        $project: {
            _id: 0,
            UserID: 1,
            Name: 1,
            Followers: "$FollowersCount",
            TotalPostsMade: { $size: "$UserPosts" },
            TotalLikesGiven: { $size: "$LikesGiven" },
            TotalCommentsGiven: { $size: "$CommentsGiven" },
            BestPostScore: { $max: "$UserPosts.EngagementScore" }
        }
    },
    { $sort: { TotalPostsMade: -1, Followers: -1 } }
]);
