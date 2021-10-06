package com.heerkirov.hedge.server.dto

import com.heerkirov.hedge.server.exceptions.ConflictingGroupMembersError
import com.heerkirov.hedge.server.utils.types.Opt

data class MetaUtilValidateRes(val topics: List<TopicSimpleRes>,
                               val authors: List<AuthorSimpleRes>,
                               val tags: List<TagSimpleRes>,
                               val notSuitable: List<TagSimpleRes>,
                               val conflictingMembers: List<ConflictingGroupMembersError.ConflictingMembers>,
                               val forceConflictingMembers: List<ConflictingGroupMembersError.ConflictingMembers>)

abstract class MetaUtilSuggestionRes(val type: String, val topics: List<TopicSimpleRes>, val authors: List<AuthorSimpleRes>, val tags: List<TagSimpleRes>)
class MetaUtilSuggestionByParentCollection(val collectionId: Int, topics: List<TopicSimpleRes>, authors: List<AuthorSimpleRes>, tags: List<TagSimpleRes>) : MetaUtilSuggestionRes("collection", topics, authors, tags)
class MetaUtilSuggestionByAlbum(val album: AlbumSimpleRes, topics: List<TopicSimpleRes>, authors: List<AuthorSimpleRes>, tags: List<TagSimpleRes>) : MetaUtilSuggestionRes("album", topics, authors, tags)
class MetaUtilSuggestionByChildren(topics: List<TopicSimpleRes>, authors: List<AuthorSimpleRes>, tags: List<TagSimpleRes>) : MetaUtilSuggestionRes("children", topics, authors, tags)
class MetaUtilSuggestionByAssociate(topics: List<TopicSimpleRes>, authors: List<AuthorSimpleRes>, tags: List<TagSimpleRes>) : MetaUtilSuggestionRes("associate", topics, authors, tags)

data class MetaUtilValidateForm(val topics: List<Int>?, val authors: List<Int>?, val tags: List<Int>?)

data class MetaUtilSuggestionForm(val imageId: Opt<Int>, val collectionId: Opt<Int>, val albumId: Opt<Int>)