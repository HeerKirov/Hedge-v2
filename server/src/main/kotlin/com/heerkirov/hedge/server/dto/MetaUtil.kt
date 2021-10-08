package com.heerkirov.hedge.server.dto

import com.heerkirov.hedge.server.enums.IdentityType
import com.heerkirov.hedge.server.enums.MetaType
import com.heerkirov.hedge.server.exceptions.ConflictingGroupMembersError

data class MetaUtilIdentity(val type: IdentityType, val id: Int)

data class MetaUtilValidateRes(val topics: List<TopicSimpleRes>,
                               val authors: List<AuthorSimpleRes>,
                               val tags: List<TagSimpleRes>,
                               val notSuitable: List<TagSimpleRes>,
                               val conflictingMembers: List<ConflictingGroupMembersError.ConflictingMembers>,
                               val forceConflictingMembers: List<ConflictingGroupMembersError.ConflictingMembers>)

sealed class MetaUtilSuggestionRes(val type: String, val topics: List<TopicSimpleRes>, val authors: List<AuthorSimpleRes>, val tags: List<TagSimpleRes>)
class MetaUtilSuggestionByParentCollection(val collectionId: Int, topics: List<TopicSimpleRes>, authors: List<AuthorSimpleRes>, tags: List<TagSimpleRes>) : MetaUtilSuggestionRes("collection", topics, authors, tags)
class MetaUtilSuggestionByAlbum(val album: AlbumSimpleRes, topics: List<TopicSimpleRes>, authors: List<AuthorSimpleRes>, tags: List<TagSimpleRes>) : MetaUtilSuggestionRes("album", topics, authors, tags)
class MetaUtilSuggestionByChildren(topics: List<TopicSimpleRes>, authors: List<AuthorSimpleRes>, tags: List<TagSimpleRes>) : MetaUtilSuggestionRes("children", topics, authors, tags)
class MetaUtilSuggestionByAssociate(topics: List<TopicSimpleRes>, authors: List<AuthorSimpleRes>, tags: List<TagSimpleRes>) : MetaUtilSuggestionRes("associate", topics, authors, tags)

data class MetaUtilRes(val topics: List<TopicSimpleRes>, val authors: List<AuthorSimpleRes>, val tags: List<TagSimpleRes>)

data class MetaUtilValidateForm(val topics: List<Int>?, val authors: List<Int>?, val tags: List<Int>?)

data class MetaUtilIdentityForm(val type: IdentityType, val id: Int)

data class MetaUtilMetaForm(val type: MetaType, val id: Int)